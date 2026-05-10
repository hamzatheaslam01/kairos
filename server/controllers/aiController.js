const { Venue, CateringService, Vendor, Deal } = require('../models');
const groqService = require('../services/groqService');
const cacheService = require('../services/cacheService');
const { service: aiRecommendationService, getTier, BUDGET_TIERS } = require('../services/aiRecommendationService');
const { z } = require('zod');

// Validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional().default([]),
});

const eventPlanRequestSchema = z.object({
  event_type: z.string(),
  budget: z.number().positive(),
  guest_count: z.number().positive(),
  city: z.string(),
  event_date: z.string().optional(),
  vibe: z.string().optional(),
  mustHave: z.string().optional(),
  specialNotes: z.string().optional(),
});

// POST /api/ai/chat — conversational AI assistant with streaming support
exports.chat = async (req, res) => {
  try {
    // Validate request
    const validation = chatRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: validation.error.errors 
      });
    }

    const { message, history } = validation.data;

    // Check if Groq is available
    if (!groqService.isAvailable()) {
      return res.status(503).json({ 
        error: 'AI service is currently unavailable. Please try again later.' 
      });
    }

    // Fetch real DB data for context
    const venues = await Venue.find({ isActive: true })
      .select('name city capacity pricePerDay rating ownCatering')
      .limit(5)
      .lean();
      
    const caterers = await CateringService.find({ isActive: true, linkedVenueId: null })
      .select('name city pricePerPerson flatPrice pricingType rating')
      .limit(5)
      .lean();
      
    const deals = await Deal.find({ isActive: true, validUntil: { $gte: new Date() } })
      .select('name description discountPercent city')
      .limit(5)
      .lean();

    // Build context-aware system prompt
    const systemPrompt = `You are KAIROS AI, the most prestigious event planning strategist for Pakistan's elite luxury and corporate market.

Your Expertise:
- Masterful understanding of Pakistani event culture (Mehndi, Barat, Valima, Corporate Galas, Birthdays, Seminars).
- Hyper-precise budget optimization across Karachi, Lahore, Islamabad, and secondary major cities.
- Deep analysis of Venue-Caterer-Decorator synergy.
- Seasonal risk mitigation (weather, fog, monsoon).
- Menu curation for diverse Pakistani palates (Desi, Continental, Pan-Asian, Fusion).

Tone: Elite, professional, highly empathetic, solution-oriented, and sophisticated. Act as a trusted advisor. Use high-end terminology but remain warm and accessible.

Current Database Context:
VENUES: ${venues.map(v => `${v.name} (${v.city}) - PKR ${v.pricePerDay.toLocaleString()}/day, capacity: ${v.capacity}`).join(' | ') || 'None available'}

CATERERS: ${caterers.map(c => `${c.name} (${c.city}) - PKR ${c.pricingType === 'per_person' ? c.pricePerPerson.toLocaleString() + '/person' : c.flatPrice.toLocaleString() + ' flat'}`).join(' | ') || 'None available'}

ACTIVE DEALS: ${deals.length ? deals.map(d => `${d.name}: ${d.discountPercent}% off - ${d.description}`).join(', ') : 'No active deals'}

Response Guidelines:
1. **Formatting**: ALWAYS use Markdown to structure your response. Use **bolding** for emphasis, bullet points for lists, and keep paragraphs short (1-2 sentences) for readability in a chat widget.
2. **Contextual**: Reference specific venues/caterers or deals from the database when relevant. If suggesting a venue, bold its name.
3. **Financials**: Provide budget estimates in PKR. Be realistic about luxury pricing.
4. **Cultural Nuance**: Naturally weave in considerations for Pakistani event customs (e.g., guest hospitality, traditional timings).
5. **Action-Oriented**: Always end your response with a clear, actionable next step or a specific clarifying question about their "Vibe", guest count, or budget to guide the planning process.
6. **Brevity**: Keep responses under 150 words. Be concise but highly impactful. Do not overwhelm the user with text.`;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({ 
        role: h.role, 
        content: h.content 
      })),
      { role: 'user', content: message }
    ];

    // Call Groq API (fast model for chat)
    const response = await groqService.chat(messages, { 
      taskType: 'fast',
      temperature: 0.7,
      maxTokens: 500,
    });

    res.json({ 
      reply: response.content,
      model: response.model,
      usage: response.usage,
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment and try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process chat request. Please try again.' 
    });
  }
};

// POST /api/ai/event-plan — generate structured event plan
exports.eventPlan = async (req, res) => {
  try {
    // Validate request
    const validation = eventPlanRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: validation.error.errors 
      });
    }

    const { 
      event_type, 
      budget, 
      guest_count, 
      city, 
      event_date, 
      vibe, 
      mustHave, 
      specialNotes 
    } = validation.data;

    // Check if Groq is available
    if (!groqService.isAvailable()) {
      return res.status(503).json({ 
        error: 'AI service is currently unavailable. Please try again later.' 
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('event-plan', {
      event_type,
      budget,
      guest_count,
      city,
    });

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('✓ Returning cached event plan');
      return res.json({ plan: cached, cached: true });
    }

    // Fetch relevant venues and caterers
    const venues = await Venue.find({ city, isActive: true })
      .select('name pricePerDay capacity amenities')
      .limit(5)
      .lean();
      
    const caterers = await CateringService.find({ city, isActive: true })
      .select('name pricePerPerson flatPrice pricingType cuisineTypes')
      .limit(5)
      .lean();

    // Define response schema - flexible to match AI output
    const eventPlanSchema = z.object({
      title: z.string().optional(),
      summary: z.string().optional(),
      timeline: z.union([
        z.array(z.string()),
        z.object({}).passthrough() // Allow object format too
      ]).optional(),
      budget_allocation: z.record(z.union([z.string(), z.number()])).optional(),
      budgetAllocation: z.record(z.union([z.string(), z.number()])).optional(),
      recommendations: z.array(z.string()).optional(),
      suggestedVenue: z.string().optional(),
      suggestedCaterer: z.string().optional(),
      tips: z.array(z.string()).optional(),
      warnings: z.array(z.string()).optional(),
    }).passthrough(); // Allow additional fields

    // Build prompts
    const systemPrompt = `You are KAIROS AI, the ultimate event planning strategist for Pakistan's elite market. Your task is to create a comprehensive, high-conversion event blueprint in JSON format.

Consider:
- High-level Pakistani event culture (e.g., specific requirements for multi-day weddings or corporate galas).
- Hyper-realistic budget allocation based on the provided PKR amount.
- Seasonal factors (heatwaves, rain, fog) and their impact on the city: ${city}.
- Optimal vendor coordination and flow of events.
- Detailed timeline including setup, guest arrival, and main segments.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "title": "A sophisticated event name",
  "summary": "A 3-sentence professional overview emphasizing value and vibe",
  "timeline": ["Setup - 2:00 PM", "Guest Arrival - 6:00 PM", "..."],
  "budget_allocation": {
    "venue": 150000,
    "catering": 200000,
    "decoration": 100000,
    "entertainment": 50000,
    "logistics": 25000
  },
  "recommendations": ["Strategy 1", "Strategy 2", "Strategy 3"],
  "suggestedVenue": "Specific Name from the list",
  "suggestedCaterer": "Specific Name from the list"
}

Use numbers (not strings) for budget_allocation values.`;

    const userPrompt = `Develop a strategic event blueprint for:

Event Type: ${event_type}
Target Vibe: ${vibe || 'Not specified'}
Budget: PKR ${budget.toLocaleString()}
Guests: ${guest_count}
Location: ${city}
Date: ${event_date || 'To be determined'}
${mustHave ? `Core Requirements: ${mustHave}` : ''}
${specialNotes ? `Strategic Notes: ${specialNotes}` : ''}

Available Inventory in ${city}:
VENUES:
${venues.map((v, i) => `${i + 1}. ${v.name} - PKR ${v.pricePerDay.toLocaleString()}/day (capacity: ${v.capacity}, amenities: ${v.amenities.join(', ')})`).join('\n') || 'Limited venue data available'}

CATERERS:
${caterers.map((c, i) => `${i + 1}. ${c.name} - ${c.pricingType === 'per_person' ? `PKR ${c.pricePerPerson}/person` : `PKR ${c.flatPrice} flat`} (cuisines: ${c.cuisineTypes.join(', ')})`).join('\n') || 'Limited caterer data available'}

Return a complete JSON blueprint focusing on the ${vibe || 'professional'} aspect and maximizing the PKR ${budget.toLocaleString()} budget.`;

    // Generate plan
    const response = await groqService.generateJSON(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      eventPlanSchema,
      { taskType: 'complex', temperature: 0.5 }
    );

    console.log('✅ Event plan generated successfully');
    console.log('Plan data keys:', Object.keys(response.data || {}));

    // Cache the result (2 hours)
    await cacheService.set(cacheKey, response.data, 7200);

    res.json({ 
      plan: response.data,
      model: response.model,
      usage: response.usage,
      cached: false,
    });

  } catch (error) {
    console.error('AI event plan error:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment and try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate event plan. Please try again.' 
    });
  }
};

// POST /api/ai/explain-recommendation — explain why an item was recommended
exports.explainRecommendation = async (req, res) => {
  try {
    const { itemType, itemId, eventId } = req.body;
    
    if (!itemType || !itemId || !eventId) {
      return res.status(400).json({ 
        error: 'itemType, itemId, and eventId are required' 
      });
    }

    // This would need event data and item data
    // For now, return a placeholder
    res.json({ 
      explanation: 'This feature will provide detailed AI explanations for recommendations.' 
    });

  } catch (error) {
    console.error('Explain recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate explanation.' });
  }
};

// POST /api/ai/suggest-alternatives — suggest alternative options
exports.suggestAlternatives = async (req, res) => {
  try {
    const { eventId, excludeIds } = req.body;
    
    if (!eventId || !excludeIds) {
      return res.status(400).json({ 
        error: 'eventId and excludeIds are required' 
      });
    }

    // This would use aiRecommendationService.suggestAlternatives
    // For now, return a placeholder
    res.json({ 
      alternatives: {
        venues: [],
        caterers: [],
        decorators: [],
      }
    });

  } catch (error) {
    console.error('Suggest alternatives error:', error);
    res.status(500).json({ error: 'Failed to suggest alternatives.' });
  }
};

// POST /api/ai/optimize-budget — suggest budget optimizations
exports.optimizeBudget = async (req, res) => {
  try {
    const { eventId, selections } = req.body;
    
    if (!eventId || !selections) {
      return res.status(400).json({ 
        error: 'eventId and selections are required' 
      });
    }

    // This would use aiRecommendationService.optimizeBudget
    // For now, return a placeholder
    res.json({ 
      optimization: 'Budget optimization tips will be provided here.' 
    });

  } catch (error) {
    console.error('Optimize budget error:', error);
    res.status(500).json({ error: 'Failed to optimize budget.' });
  }
};

// GET /api/ai/stats — get AI usage statistics (admin only)
exports.getStats = async (req, res) => {
  try {
    const groqStats = groqService.getStats();
    const cacheStats = await cacheService.getStats();

    res.json({
      groq: groqStats,
      cache: cacheStats,
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics.' });
  }
};

