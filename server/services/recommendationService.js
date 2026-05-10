const { Venue, CateringService, Vendor, Review, Deal } = require('../models');
const { service: aiRecommendationService, getTier } = require('./aiRecommendationService');

// Score helpers (rule-based fallback)
function calculateBudgetScore(price, budget) {
  price = parseFloat(price); 
  budget = parseFloat(budget);
  if (budget <= 0) return 0;
  return Math.min(Math.max(0, 1 - (price - budget) / budget), 1.0);
}

function calculateRatingScore(rating) { 
  return parseFloat(rating || 0) / 5.0; 
}

function calculateCapacityScore(guests, cap) {
  if (!cap || cap <= 0) return 1;
  return cap >= guests ? 1 : 0;
}

function calculateScore(price, budget, rating, capacity, guests) {
  return (calculateBudgetScore(price, budget) * 40) + 
         (calculateRatingScore(rating) * 35) + 
         (calculateCapacityScore(guests, capacity) * 25);
}

async function getAverageRatings(targetType) {
  const agg = await Review.aggregate([
    { $match: { targetType } },
    { $group: { 
      _id: '$targetId', 
      avg_rating: { $avg: '$rating' }, 
      review_count: { $sum: 1 } 
    }}
  ]);
  
  const map = {};
  agg.forEach(r => { 
    map[r._id.toString()] = { 
      avg_rating: parseFloat(r.avg_rating.toFixed(1)), 
      review_count: r.review_count 
    }; 
  });
  
  return map;
}

async function getRecommendations(event) {
  const { budget, guestCount, city, eventDate, eventType, vibe, preferences } = event;
  const tier = getTier(budget);
  
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`${tier.emoji} KAIROS Tier Engine: ${tier.label}`);
  console.log(`   Budget: PKR ${budget.toLocaleString()} | Guests: ${guestCount} | City: ${city}`);
  console.log(`   Allocations → V:${tier.venueCount} C:${tier.catererCount} D:${tier.decoratorCount}`);
  console.log(`${'═'.repeat(50)}\n`);

  // Get average ratings from reviews
  const venueRatings = await getAverageRatings('venue');
  const cateringRatings = await getAverageRatings('catering');
  const vendorRatings = await getAverageRatings('vendor');

  // Fetch venues — filter by budget ceiling for lower tiers
  const venueFilter = { city, isActive: true };
  if (tier.key === 'STARTER' || tier.key === 'ESSENTIAL') {
    venueFilter.pricePerDay = { $lte: budget * 0.6 }; // venue can't eat >60% of budget
  }
  let venues = await Venue.find(venueFilter).lean();
  
  // Filter out booked venues if date is specified
  if (eventDate) {
    const checkDate = new Date(eventDate).toISOString().split('T')[0];
    venues = venues.filter(v => 
      !v.bookedDates?.some(bd => 
        new Date(bd.date).toISOString().split('T')[0] === checkDate
      )
    );
  }
  
  // Attach ratings to venues
  venues.forEach(v => { 
    const r = venueRatings[v._id.toString()]; 
    if (r) { v.rating = r.avg_rating; v.review_count = r.review_count; } 
  });

  // Fetch caterers
  let caterers = await CateringService.find({ city, isActive: true, linkedVenueId: null }).lean();
  
  caterers.forEach(c => {
    c.effectivePrice = c.pricingType === 'per_person' 
      ? (c.pricePerPerson || 0) * guestCount 
      : (c.flatPrice || 0);
    const r = cateringRatings[c._id.toString()]; 
    if (r) { c.rating = r.avg_rating; c.review_count = r.review_count; }
  });

  // For lower tiers, filter out expensive caterers
  if (tier.key === 'STARTER') {
    caterers = caterers.filter(c => c.effectivePrice <= budget * 0.4);
  } else if (tier.key === 'ESSENTIAL') {
    caterers = caterers.filter(c => c.effectivePrice <= budget * 0.5);
  }

  // Fetch decorators — ONLY if tier allows
  let decorators = [];
  if (tier.decoratorCount > 0) {
    const decorFilter = { category: 'decoration', city, isActive: true };
    if (tier.key === 'STANDARD') {
      decorFilter.price = { $lte: budget * 0.15 }; // cap at 15% for Standard
    }
    decorators = await Vendor.find(decorFilter).lean();
    decorators.forEach(d => { 
      const r = vendorRatings[d._id.toString()]; 
      if (r) { d.rating = r.avg_rating; d.review_count = r.review_count; } 
    });
  }

  // Fetch applicable deals
  const now = new Date();
  const deals = await Deal.find({ 
    isActive: true, validUntil: { $gte: now }, 
    $or: [{ city }, { city: { $exists: false } }] 
  }).lean();

  // Calculate rule-based scores
  const ruleBasedScores = { venues: {}, caterers: {}, decorators: {} };

  venues.forEach(v => {
    ruleBasedScores.venues[v._id.toString()] = calculateScore(v.pricePerDay, budget, v.rating, v.capacity, guestCount);
  });
  caterers.forEach(c => {
    ruleBasedScores.caterers[c._id.toString()] = calculateScore(c.effectivePrice, budget, c.rating, null, guestCount);
  });
  decorators.forEach(d => {
    ruleBasedScores.decorators[d._id.toString()] = calculateScore(d.price, budget, d.rating, null, guestCount);
  });

  // Sort by score before sending to AI
  venues.sort((a, b) => (ruleBasedScores.venues[b._id.toString()] || 0) - (ruleBasedScores.venues[a._id.toString()] || 0));
  caterers.sort((a, b) => (ruleBasedScores.caterers[b._id.toString()] || 0) - (ruleBasedScores.caterers[a._id.toString()] || 0));
  decorators.sort((a, b) => (ruleBasedScores.decorators[b._id.toString()] || 0) - (ruleBasedScores.decorators[a._id.toString()] || 0));

  // Try AI-powered recommendations
  let method = 'rule_based';
  let aiReasoning = null;
  let aiConfidence = null;
  let budgetOptimization = null;
  let alternatives = null;
  let suggestedDeal = null;
  let tierInfo = tier;

  try {
    console.log('🤖 Attempting AI-powered recommendations...');
    
    const aiResult = await aiRecommendationService.generateRecommendations(
      { budget, guestCount, city, eventDate, eventType, vibe, preferences },
      venues, caterers, decorators, deals, ruleBasedScores
    );

    if (aiResult && aiResult.venues) {
      method = 'ai_powered';
      aiReasoning = aiResult.reasoning || null;
      aiConfidence = aiResult.confidence || null;
      budgetOptimization = aiResult.budgetOptimization || null;
      alternatives = aiResult.alternatives || null;
      suggestedDeal = aiResult.suggestedDeal || null;
      if (aiResult.tier) tierInfo = aiResult.tier;

      console.log('✓ AI recommendations generated successfully');

      const reorder = (items, ids, scoreKey) => {
        const map = {}; 
        items.forEach(i => { map[i._id.toString()] = i; });
        return ids
          .map(id => map[id])
          .filter(Boolean)
          .map((item, idx) => ({ 
            ...item, score: 100 - idx * 5, ai_rank: idx + 1,
            rule_based_score: ruleBasedScores[scoreKey][item._id.toString()]
          }));
      };

      return { 
        method, tier: tierInfo,
        ai_reasoning: aiReasoning, ai_confidence: aiConfidence,
        budget_optimization: budgetOptimization, alternatives, suggestedDeal,
        venues: reorder(venues, aiResult.venues, 'venues').slice(0, tier.venueCount), 
        caterers: reorder(caterers, aiResult.caterers, 'caterers').slice(0, tier.catererCount), 
        decorators: reorder(decorators, aiResult.decorators, 'decorators').slice(0, tier.decoratorCount), 
        deals,
      };
    }
  } catch (aiError) {
    console.error('❌ AI failed, falling back to rule-based:', aiError.message);
  }

  // Fallback: Rule-based scoring
  console.log('📊 Using rule-based recommendations');
  
  const scored = (items, priceField, scoreKey) => 
    items
      .map(i => ({ 
        ...i, 
        score: Math.round(calculateScore(i[priceField] || i.effectivePrice || 0, budget, i.rating, i.capacity, guestCount) * 100) / 100,
        rule_based_score: ruleBasedScores[scoreKey][i._id.toString()]
      }))
      .sort((a, b) => b.score - a.score);

  return { 
    method, tier: tierInfo,
    ai_reasoning: null, ai_confidence: null,
    budget_optimization: null, alternatives: null, suggestedDeal: null,
    venues: scored(venues, 'pricePerDay', 'venues').slice(0, tier.venueCount), 
    caterers: scored(caterers, 'effectivePrice', 'caterers').slice(0, tier.catererCount), 
    decorators: scored(decorators, 'price', 'decorators').slice(0, tier.decoratorCount), 
    deals,
  };
}

module.exports = { getRecommendations, calculateScore };
