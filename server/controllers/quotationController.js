const { Quotation, Event, Deal } = require('../models');

// POST /api/quotations — create a quotation
exports.create = async (req, res) => {
  try {
    const { event_id, items, deal_id } = req.body;

    if (!event_id || !items || !items.length) {
      return res.status(400).json({ error: 'event_id and items are required.' });
    }

    const event = await Event.findOne({ _id: event_id, userId: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    let subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
    let discount = 0;

    if (deal_id) {
      const deal = await Deal.findOne({ _id: deal_id, isActive: true });
      if (deal && new Date() <= new Date(deal.validUntil)) {
        if (deal.discountPercent > 0) discount = subtotal * (deal.discountPercent / 100);
        if (deal.discountFlat > 0) discount += deal.discountFlat;
      }
    }

    const total = Math.round((subtotal - discount) * 100) / 100;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    const quotation = new Quotation({
      userId: req.user._id,
      eventId: event_id,
      items,
      subtotal,
      discount: Math.round(discount * 100) / 100,
      dealId: deal_id || null,
      total,
      status: 'sent_to_admin',
      validUntil
    });
    await quotation.save();

    event.status = 'quoted';
    await event.save();

    res.status(201).json({ message: 'Quotation created and sent to admin', quotation });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Server error creating quotation.' });
  }
};

// GET /api/quotations/my
exports.getMyQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ userId: req.user._id })
      .populate('eventId', 'eventType city budget guestCount')
      .populate('dealId', 'name discountPercent')
      .sort({ createdAt: -1 });
    res.json({ quotations });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Server error fetching quotations.' });
  }
};

// GET /api/quotations/:id
exports.getById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('eventId')
      .populate('dealId');
    if (!quotation) return res.status(404).json({ error: 'Quotation not found.' });
    res.json({ quotation });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Server error fetching quotation.' });
  }
};
