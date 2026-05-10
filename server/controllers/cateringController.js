const { CateringService, Venue } = require('../models');

// GET /api/catering — list all active catering services
exports.getAll = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true, linkedVenueId: null };
    if (city) filter.city = city;

    const caterers = await CateringService.find(filter).sort({ rating: -1 });
    res.json({ caterers });
  } catch (error) {
    console.error('Get catering services error:', error);
    res.status(500).json({ error: 'Server error fetching catering services.' });
  }
};

// GET /api/catering/:id — get single catering service
exports.getById = async (req, res) => {
  try {
    const caterer = await CateringService.findById(req.params.id);
    if (!caterer) {
      return res.status(404).json({ error: 'Catering service not found.' });
    }
    res.json({ caterer });
  } catch (error) {
    console.error('Get catering service error:', error);
    res.status(500).json({ error: 'Server error fetching catering service.' });
  }
};

// GET /api/catering/venue/:venueId — get catering linked to a venue
exports.getByVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found.' });
    }

    // Return venue's own catering if available
    const response = {
      venue: { _id: venue._id, name: venue.name },
      ownCatering: venue.ownCatering,
      venueCateringDetails: venue.ownCatering ? venue.cateringDetails : null
    };

    // Also return linked independent caterers
    const linkedCaterers = await CateringService.find({
      linkedVenueId: venue._id,
      isActive: true
    });

    // And other independent caterers in same city
    const independentCaterers = await CateringService.find({
      city: venue.city,
      isActive: true,
      linkedVenueId: null
    }).sort({ rating: -1 });

    response.linkedCaterers = linkedCaterers;
    response.independentCaterers = independentCaterers;

    res.json(response);
  } catch (error) {
    console.error('Get venue catering error:', error);
    res.status(500).json({ error: 'Server error fetching venue catering.' });
  }
};
