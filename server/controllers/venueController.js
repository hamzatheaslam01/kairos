const { Venue } = require('../models');

// GET /api/venues — list all active venues
exports.getAll = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true };
    if (city) filter.city = city;

    const venues = await Venue.find(filter).sort({ rating: -1 });
    res.json({ venues });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ error: 'Server error fetching venues.' });
  }
};

// GET /api/venues/:id — get single venue
exports.getById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found.' });
    }
    res.json({ venue });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({ error: 'Server error fetching venue.' });
  }
};

// GET /api/venues/:id/availability?date=2026-08-15
exports.checkAvailability = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required.' });
    }

    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found.' });
    }

    const checkDate = new Date(date);
    const isBooked = venue.bookedDates.some(bd => {
      const bdDate = new Date(bd.date);
      return bdDate.toISOString().split('T')[0] === checkDate.toISOString().split('T')[0];
    });

    res.json({
      venue_id: venue._id,
      date,
      available: !isBooked
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Server error checking availability.' });
  }
};

// GET /api/venues/:id/catering — get venue's own catering details
exports.getCateringDetails = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found.' });
    }

    if (!venue.ownCatering) {
      return res.json({ ownCatering: false, cateringDetails: null });
    }

    res.json({
      ownCatering: true,
      cateringDetails: venue.cateringDetails
    });
  } catch (error) {
    console.error('Get venue catering error:', error);
    res.status(500).json({ error: 'Server error fetching venue catering.' });
  }
};
