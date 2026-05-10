const { Event } = require('../models');
const { getRecommendations } = require('../services/recommendationService');

// GET /api/recommendations?eventId=xxx
exports.getRecommendations = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId query parameter is required.' });

    const event = await Event.findOne({ _id: eventId, userId: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const recommendations = await getRecommendations({
      budget: event.budget,
      guestCount: event.guestCount,
      city: event.city,
      eventDate: event.eventDate,
      eventType: event.eventType,
      vibe: event.preferences?.vibe,
      preferences: event.preferences?.tags || []
    });

    res.json({ message: 'Recommendations generated', event_id: event._id, recommendations });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Server error generating recommendations.' });
  }
};
