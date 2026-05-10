const { Event, Booking } = require('../models');

// POST /api/events — save event details
exports.create = async (req, res) => {
  try {
    const { event_type, budget, guest_count, city, event_date, event_name, preferences } = req.body;

    if (!event_type || !budget || !guest_count || !city) {
      return res.status(400).json({ error: 'Event type, budget, guest count, and city are required.' });
    }

    const event = new Event({
      userId: req.user._id,
      eventName: event_name || '',
      eventType: event_type,
      budget: parseFloat(budget),
      guestCount: parseInt(guest_count),
      city,
      eventDate: event_date || null,
      preferences: preferences || {}
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error creating event.' });
  }
};

// GET /api/events/:id — retrieve a specific event
exports.getById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check for associated booking
    const booking = await Booking.findOne({ eventId: event._id });

    res.json({ event, booking: booking || null });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Server error fetching event.' });
  }
};

// GET /api/events — retrieve all events for logged-in user
exports.getAll = async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    // Fetch bookings for all events
    const eventIds = events.map(e => e._id);
    const bookings = await Booking.find({ eventId: { $in: eventIds } });

    const bookingMap = {};
    bookings.forEach(b => { bookingMap[b.eventId.toString()] = b; });

    const eventsWithBookings = events.map(e => ({
      ...e.toObject(),
      booking: bookingMap[e._id.toString()] || null
    }));

    res.json({ events: eventsWithBookings });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error fetching events.' });
  }
};
