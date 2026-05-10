const groqService = require('./groqService');
const cacheService = require('./cacheService');
const { z } = require('zod');

// --- BUDGET TIER SYSTEM ---
const BUDGET_TIERS = {
  STARTER:   { min: 0,       max: 300000,   label: 'Starter',        venueCount: 6, catererCount: 6, decoratorCount: 6, emoji: '🌱' },
  ESSENTIAL: { min: 300000,  max: 700000,   label: 'Essential',      venueCount: 7, catererCount: 7, decoratorCount: 6, emoji: '⚡' },
  STANDARD:  { min: 700000,  max: 1500000,  label: 'Standard',       venueCount: 8, catererCount: 8, decoratorCount: 7, emoji: '✨' },
  PREMIUM:   { min: 1500000, max: 5000000,  label: 'Premium',        venueCount: 9, catererCount: 9, decoratorCount: 8, emoji: '💎' },
  LUXURY:    { min: 5000000, max: Infinity,  label: 'Ultra Luxury',   venueCount: 10, catererCount: 10, decoratorCount: 10, emoji: '👑' },
};

function getTier(budget) {
  for (const [key, tier] of Object.entries(BUDGET_TIERS)) {
    if (budget >= tier.min && budget < tier.max) return { key, ...tier };
  }
  return { key: 'STARTER', ...BUDGET_TIERS.STARTER };
}

// Flexible Zod schema — accepts string IDs OR objects with an id field, normalizes to strings
const idOrObj = z.union([
  z.string(),
  z.object({ id: z.string() }).passthrough().transform(o => o.id),
  z.object({ ID: z.string() }).passthrough().transform(o => o.ID),
]).transform(val => typeof val === 'string' ? val : String(val));

const RecommendationSchema = z.object({
  venues: z.array(idOrObj).optional().default([]),
  caterers: z.array(idOrObj).optional().default([]),
  decorators: z.array(idOrObj).optional().default([]),
  reasoning: z.union([
    z.object({
      venues: z.string().optional().default(''),
      caterers: z.string().optional().default(''),
      decorators: z.string().optional().default(''),
      overall: z.string().optional().default(''),
    }),
    z.string().transform(str => ({ venues: '', caterers: '', decorators: '', overall: str }))
  ]).optional().default({}),

  confidence: z.object({
    venues: z.number().min(0).max(1).optional().default(0.5),
    caterers: z.number().min(0).max(1).optional().default(0.5),
    decorators: z.number().min(0).max(1).optional().default(0.5),
  }).optional().default({}),
  budgetOptimization: z.string().optional().default(''),
  alternatives: z.object({
    venues: z.array(idOrObj).optional().default([]),
    caterers: z.array(idOrObj).optional().default([]),
    decorators: z.array(idOrObj).optional().default([]),
  }).optional().default({}),
  suggestedDeal: z.string().optional().nullable(),
  budgetBreakdown: z.object({
    venue: z.number().optional().default(0),
    catering: z.number().optional().default(0),
    decoration: z.number().optional().default(0),
    total: z.number().optional().default(0),
  }).optional().default({}),
});

class AIRecommendationService {
  /**
   * Generate AI-powered recommendations with dynamic tier scaling
   */
  async generateRecommendations(event, venues, caterers, decorators, deals, ruleBasedScores) {
    if (!groqService.isAvailable()) {
      console.log('Groq service not available, skipping AI recommendations');
      return null;
    }

    try {
      const tier = getTier(event.budget);
      console.log(`${tier.emoji} Budget Tier: ${tier.label} (PKR ${event.budget.toLocaleString()})`);
      console.log(`   → Venues: ${tier.venueCount} | Caterers: ${tier.catererCount} | Decorators: ${tier.decoratorCount}`);

      // Generate cache key
      const cacheKey = cacheService.generateKey('ai-recommendations', {
        eventType: event.eventType, budget: event.budget, guestCount: event.guestCount,
        city: event.city, vibe: event.vibe, preferences: event.preferences || [],
      });

      const cached = await cacheService.get(cacheKey);
      if (cached) { console.log('✓ Using cached AI recommendations'); return cached; }

      // Prepare data slices scaled by tier
      const venueSlice = Math.min(venues.length, tier.venueCount + 5);
      const catererSlice = Math.min(caterers.length, tier.catererCount + 5);
      const decoratorSlice = tier.decoratorCount > 0 ? Math.min(decorators.length, tier.decoratorCount + 5) : 0;

      const venueData = venues.slice(0, venueSlice).map(v => ({
        id: v._id.toString(), name: v.name, price: v.pricePerDay, capacity: v.capacity,
        rating: v.rating || 0, reviewCount: v.review_count || 0,
        amenities: v.amenities || [], description: v.description || '',
      }));

      const catererData = caterers.slice(0, catererSlice).map(c => ({
        id: c._id.toString(), name: c.name, price: c.effectivePrice, pricingType: c.pricingType,
        rating: c.rating || 0, cuisines: c.cuisineTypes || [], specialties: c.specialties || [],
      }));

      let decoratorData = [];
      if (tier.decoratorCount > 0) {
        // For lower tiers with some decor, filter by price ceiling
        const maxDecorPrice = event.budget * 0.15;
        const affordable = decorators.filter(d => d.price <= maxDecorPrice);
        const pool = affordable.length > 0 ? affordable : decorators;
        decoratorData = pool.slice(0, decoratorSlice).map(d => ({
          id: d._id.toString(), name: d.name, price: d.price,
          rating: d.rating || 0, specialties: d.specialties || [],
        }));
      }

      const dealData = deals.map(d => ({
        id: d._id.toString(), name: d.name, discount: d.discountPercent,
        description: d.description, applicableTo: d.applicableTo || [],
      }));

      // Build prompts
      const systemPrompt = this.buildSystemPrompt(event.budget, tier);
      const userPrompt = this.buildUserPrompt(event, venueData, catererData, decoratorData, dealData, tier);

      console.log('🤖 Generating AI recommendations...');
      const response = await groqService.generateJSON(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        RecommendationSchema,
        { taskType: 'complex' }
      );

      // Validation & self-correction
      let aiData = response.data;
      const context = { event, venueData, catererData, decoratorData, dealData, tier };
      const validationResult = this.validateResponse(aiData, context);

      if (!validationResult.isValid) {
        console.log(`⚠️ Validation errors: ${validationResult.errors.join('; ')}. Self-correcting...`);
        try {
          const correctionPrompt = `Your previous response had errors:\n${validationResult.errors.map(e => `- ${e}`).join('\n')}\n\nCorrect them. Return ONLY vendor IDs as plain strings. Budget limit: PKR ${event.budget.toLocaleString()}.`;
          const corrected = await groqService.generateJSON(
            [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt },
             { role: 'assistant', content: JSON.stringify(aiData) }, { role: 'user', content: correctionPrompt }],
            RecommendationSchema, { taskType: 'complex' }
          );
          aiData = corrected.data;
        } catch (corrErr) {
          console.error('Self-correction failed, applying hard sanity:', corrErr.message);
        }
        aiData = this.enforceSanity(aiData, context);
      } else {
        aiData = this.enforceSanity(aiData, context);
      }

      const aiResult = {
        ...aiData, method: 'ai_powered', model: response.model, usage: response.usage,
        tier: { key: tier.key, label: tier.label, emoji: tier.emoji,
                venueCount: tier.venueCount, catererCount: tier.catererCount, decoratorCount: tier.decoratorCount },
        validation: { status: validationResult.isValid ? 'passed' : 'corrected', checks: validationResult.checks },
      };

      await cacheService.set(cacheKey, aiResult, 3600);
      console.log('✓ AI recommendations generated and validated');
      return aiResult;
    } catch (error) {
      console.error('AI recommendation error:', error.message);
      return null;
    }
  }

  validateResponse(data, context) {
    const { event, venueData, catererData, decoratorData, tier } = context;
    const errors = [];
    const checks = { idsExist: true, budgetCompliance: true, capacityCompliance: true };

    const validVIds = venueData.map(v => v.id);
    const validCIds = catererData.map(c => c.id);
    const validDIds = decoratorData.map(d => d.id);

    const badV = (data.venues || []).filter(id => !validVIds.includes(id));
    const badC = (data.caterers || []).filter(id => !validCIds.includes(id));
    const badD = (data.decorators || []).filter(id => !validDIds.includes(id));
    if (badV.length + badC.length + badD.length > 0) {
      errors.push(`Invalid IDs: ${[...badV, ...badC, ...badD].join(', ')}`);
      checks.idsExist = false;
    }

    // Budget check on primary picks
    if (data.venues?.[0] && data.caterers?.[0]) {
      const v = venueData.find(x => x.id === data.venues[0]);
      const c = catererData.find(x => x.id === data.caterers[0]);
      const d = data.decorators?.[0] ? decoratorData.find(x => x.id === data.decorators[0]) : null;
      if (v && c) {
        const total = v.price + (c.price * event.guestCount) + (d ? d.price : 0);
        if (total > event.budget * 1.10) {
          errors.push(`Over budget: PKR ${total.toLocaleString()} vs limit PKR ${event.budget.toLocaleString()}`);
          checks.budgetCompliance = false;
        }
      }
    }

    // Capacity check
    if (data.venues?.[0]) {
      const v = venueData.find(x => x.id === data.venues[0]);
      if (v && v.capacity < event.guestCount) {
        errors.push(`Venue too small: ${v.capacity} < ${event.guestCount} guests`);
        checks.capacityCompliance = false;
      }
    }

    return { isValid: errors.length === 0, errors, checks };
  }

  enforceSanity(data, context) {
    const { venueData, catererData, decoratorData, tier } = context;
    const s = { ...data };
    const vIds = venueData.map(v => v.id);
    const cIds = catererData.map(c => c.id);
    const dIds = decoratorData.map(d => d.id);

    s.venues = (s.venues || []).filter(id => vIds.includes(id)).slice(0, tier.venueCount);
    s.caterers = (s.caterers || []).filter(id => cIds.includes(id)).slice(0, tier.catererCount);
    s.decorators = (s.decorators || []).filter(id => dIds.includes(id)).slice(0, tier.decoratorCount);

    if (s.venues.length === 0 && vIds.length > 0) s.venues = vIds.slice(0, tier.venueCount);
    if (s.caterers.length === 0 && cIds.length > 0) s.caterers = cIds.slice(0, tier.catererCount);
    if (s.decorators.length === 0 && dIds.length > 0 && tier.decoratorCount > 0) s.decorators = dIds.slice(0, tier.decoratorCount);

    return s;
  }

  buildSystemPrompt(budget, tier) {
    const tierInstructions = {
      STARTER: `[TIER: STARTER — Budget < PKR 300K]
- BUDGET FOCUSED: Recommend exactly ${tier.venueCount} affordable venues, ${tier.catererCount} budget caterers, and ${tier.decoratorCount} cost-effective decorators.
- Prioritize all-inclusive venues with basic amenities.
- Focus on value-for-money, not luxury.`,
      ESSENTIAL: `[TIER: ESSENTIAL — Budget PKR 300K–700K]
- Recommend exactly ${tier.venueCount} venues, ${tier.catererCount} caterers, and ${tier.decoratorCount} decorators.
- Balance between quality and affordability.
- Prioritize venues with included amenities.`,
      STANDARD: `[TIER: STANDARD — Budget PKR 700K–1.5M]
- Recommend exactly ${tier.venueCount} venues, ${tier.catererCount} caterers, and ${tier.decoratorCount} decorators.
- Recommend mid-range vendors with strong reviews.
- This is where variety begins. Provide a good mix of styles.`,
      PREMIUM: `[TIER: PREMIUM — Budget PKR 1.5M–5M]
- Luxury experience: Recommend exactly ${tier.venueCount} venues, ${tier.catererCount} caterers, and ${tier.decoratorCount} decorators.
- Curate premium vendors with high ratings.
- Prioritize brand prestige and vendor synergy.
- Include themed decorator packages.`,
      LUXURY: `[TIER: ULTRA LUXURY — Budget PKR 5M+]
- No expense spared: Recommend exactly ${tier.venueCount} venues, ${tier.catererCount} caterers, and ${tier.decoratorCount} decorators.
- ONLY elite, top-rated vendors.
- Focus on bespoke experiences and heritage grandeur.
- Recommend celebrity/designer vendors.`,
    };

    return `You are KAIROS AI, an elite Pakistani event planning intelligence.

${tierInstructions[tier.key]}

CRITICAL RULES:
1. Return vendor IDs as PLAIN STRINGS, not objects.
2. Total cost (venue + catering×guests + decorator) MUST be ≤ PKR ${budget.toLocaleString()}.
3. Venue capacity must exceed guest count by 10%.
4. Match user's vibe and preference tags precisely.
5. Provide strategic reasoning for each category.

Response: Valid JSON only. No markdown.`;
  }

  buildUserPrompt(event, venues, caterers, decorators, deals, tier) {
    let prompt = `Event: ${event.eventType} | Vibe: ${event.vibe || 'Not specified'}
Budget: PKR ${event.budget.toLocaleString()} (${tier.label} Tier)
Guests: ${event.guestCount} | City: ${event.city}
Date: ${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBD'}
Tags: ${event.preferences?.join(', ') || 'None'}

VENUES (${venues.length}):
${venues.map((v, i) => `${i+1}. [ID: ${v.id}] ${v.name} — PKR ${v.price.toLocaleString()}/day, Cap: ${v.capacity}, ★${v.rating}, Amenities: ${v.amenities.join(', ')}`).join('\n')}

CATERERS (${caterers.length}):
${caterers.map((c, i) => `${i+1}. [ID: ${c.id}] ${c.name} — PKR ${c.price.toLocaleString()} ${c.pricingType}, ★${c.rating}, Cuisines: ${c.cuisines.join(', ')}`).join('\n')}`;

    if (decorators.length > 0) {
      prompt += `\n\nDECORATORS (${decorators.length}):\n${decorators.map((d, i) => `${i+1}. [ID: ${d.id}] ${d.name} — PKR ${d.price.toLocaleString()}, ★${d.rating}, Specialties: ${d.specialties.join(', ')}`).join('\n')}`;
    } else {
      prompt += `\n\nDECORATORS: None available for this tier. Return empty array for decorators.`;
    }

    if (deals.length > 0) {
      prompt += `\n\nDEALS:\n${deals.map(d => `- [${d.id}] ${d.name}: ${d.discount}% off`).join('\n')}`;
    }

    prompt += `\n\nSelect exactly: ${tier.venueCount} venues, ${tier.catererCount} caterers, ${tier.decoratorCount} decorators.
Return IDs as plain strings in arrays. Include reasoning and budgetBreakdown.`;

    return prompt;
  }

  async explainRecommendation(itemType, itemId, event, allItems, reasoning) {
    if (!groqService.isAvailable()) return 'AI explanation not available.';
    try {
      const item = allItems.find(i => i._id.toString() === itemId);
      if (!item) return 'Item not found.';
      const response = await groqService.chat([
        { role: 'system', content: `You are KAIROS AI. Explain why this ${itemType} was recommended. Be concise (2-3 sentences).` },
        { role: 'user', content: `Event: ${event.eventType}, Budget: PKR ${event.budget.toLocaleString()}, Guests: ${event.guestCount}\n${itemType}: ${item.name} — PKR ${item.price || item.pricePerDay || item.effectivePrice || 0}, ★${item.rating || 0}/5\nReasoning: ${reasoning || 'Based on budget and quality.'}` }
      ], { taskType: 'fast', maxTokens: 200 });
      return response.content;
    } catch (e) { return 'Unable to generate explanation.'; }
  }

  async suggestAlternatives(event, excludeIds, venues, caterers, decorators) {
    const fallback = {
      venues: venues.filter(v => !excludeIds.venues.includes(v._id.toString())).slice(0, 3).map(v => v._id.toString()),
      caterers: caterers.filter(c => !excludeIds.caterers.includes(c._id.toString())).slice(0, 3).map(c => c._id.toString()),
      decorators: decorators.filter(d => !excludeIds.decorators.includes(d._id.toString())).slice(0, 3).map(d => d._id.toString()),
    };
    if (!groqService.isAvailable()) return fallback;
    try {
      const response = await groqService.generateJSON([
        { role: 'system', content: 'You are KAIROS AI. Suggest alternative vendors. Return IDs as plain strings.' },
        { role: 'user', content: `Event: ${event.eventType}, Budget: PKR ${event.budget.toLocaleString()}, Guests: ${event.guestCount}\nExclude: ${JSON.stringify(excludeIds)}\nSuggest 3 alternatives per category.` }
      ], z.object({ 
        venues: z.array(z.string()), 
        caterers: z.array(z.string()), 
        decorators: z.array(z.string()), 
        reasoning: z.union([z.string(), z.object({ overall: z.string() }).transform(o => o.overall)]).optional().default('')
      }), { taskType: 'fast' });

      return response.data;
    } catch (e) { return fallback; }
  }

  async optimizeBudget(event, selectedVenue, selectedCaterer, selectedDecorator) {
    if (!groqService.isAvailable()) return 'AI budget optimization not available.';
    try {
      const total = (selectedVenue?.pricePerDay || 0) + (selectedCaterer?.effectivePrice || 0) + (selectedDecorator?.price || 0);
      const response = await groqService.chat([
        { role: 'system', content: 'You are KAIROS AI budget expert. Provide 3-4 optimization tips.' },
        { role: 'user', content: `Budget: PKR ${event.budget.toLocaleString()}\nVenue: ${selectedVenue?.name} PKR ${selectedVenue?.pricePerDay || 0}\nCaterer: ${selectedCaterer?.name} PKR ${selectedCaterer?.effectivePrice || 0}\nDecorator: ${selectedDecorator?.name || 'None'} PKR ${selectedDecorator?.price || 0}\nTotal: PKR ${total.toLocaleString()} ${total > event.budget ? '⚠️ OVER BUDGET' : '✓ Under budget'}` }
      ], { taskType: 'fast', maxTokens: 300 });
      return response.content;
    } catch (e) { return 'Unable to generate tips.'; }
  }
}

module.exports = { service: new AIRecommendationService(), getTier, BUDGET_TIERS };
