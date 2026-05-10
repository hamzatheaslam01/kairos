const { Deal } = require('../models');

// GET /api/deals — list active deals
exports.getAll = async (req, res) => {
  try {
    const { city, event_type, budget } = req.query;
    const now = new Date();
    const filter = { isActive: true, validUntil: { $gte: now } };

    if (city) filter.city = city;
    if (event_type) filter.eventTypes = event_type;
    if (budget) {
      filter.minBudget = { $lte: parseFloat(budget) };
      filter.maxBudget = { $gte: parseFloat(budget) };
    }

    const deals = await Deal.find(filter).sort({ discountPercent: -1 });
    res.json({ deals });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Server error fetching deals.' });
  }
};

// GET /api/deals/:id
exports.getById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });
    res.json({ deal });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Server error fetching deal.' });
  }
};
