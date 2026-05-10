const { Booking, Event, Venue, Vendor, CateringService, User } = require('../models');

// POST /api/bookings — create a new booking
exports.create = async (req, res) => {
  try {
    const { event_id, venue_id, caterer_id, decor_id, event_date } = req.body;

    if (!event_id || !venue_id || !event_date) {
      return res.status(400).json({
        error: 'event_id, venue_id, and event_date are required.'
      });
    }

    // Verify event belongs to user
    const event = await Event.findOne({ _id: event_id, userId: req.user._id });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if event already has a booking
    const existingBooking = await Booking.findOne({ eventId: event_id });
    if (existingBooking) {
      return res.status(400).json({ error: 'This event already has a booking.' });
    }

    // Verify venue exists and is active
    const venue = await Venue.findOne({ _id: venue_id, isActive: true });
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or is inactive.' });
    }

    // Check venue availability on the requested date
    const requestedDate = new Date(event_date).toISOString().split('T')[0];
    const isBooked = (venue.bookedDates || []).some(bd => 
      new Date(bd.date).toISOString().split('T')[0] === requestedDate
    );
    if (isBooked) {
      return res.status(400).json({ error: 'Venue is already booked on this date.' });
    }

    let cateringPrice = 0;
    let caterer = null;
    if (caterer_id) {
        caterer = await CateringService.findOne({ _id: caterer_id, isActive: true });
        if (!caterer) return res.status(404).json({ error: 'Catering service not found or inactive.' });
        cateringPrice = caterer.getEffectivePrice(event.guestCount);
    }

    let decorPrice = 0;
    let decorator = null;
    if (decor_id) {
        decorator = await Vendor.findOne({ _id: decor_id, category: 'decoration', isActive: true });
        if (!decorator) return res.status(404).json({ error: 'Decorator not found or inactive.' });
        decorPrice = decorator.pricingType === 'per_person' ? decorator.price * event.guestCount : decorator.price;
    }

    const venuePrice = venue.pricePerDay;
    const totalPrice = venuePrice + cateringPrice + decorPrice;

    // Create booking
    const booking = new Booking({
      userId: req.user._id,
      eventId: event_id,
      venueId: venue_id,
      cateringId: caterer_id || null,
      decoratorId: decor_id || null,
      eventDate: new Date(event_date),
      totalPrice: Math.round(totalPrice * 100) / 100,
      status: 'pending'
    });

    await booking.save();

    // Mark venue as booked on this date (still reserve it while pending)
    if (!venue.bookedDates) venue.bookedDates = [];
    venue.bookedDates.push({ date: new Date(event_date), bookingId: booking._id });
    await venue.save();

    // Update event date if not set
    if (!event.eventDate) {
      event.eventDate = new Date(event_date);
      event.status = 'booked';
      await event.save();
    }

    // Populate and return
    const fullBooking = await Booking.findById(booking._id)
      .populate('eventId')
      .populate('venueId')
      .populate('cateringId')
      .populate('decoratorId');

    res.status(201).json({
      message: 'Booking request sent successfully. Awaiting admin confirmation.',
      booking: fullBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error creating booking.' });
  }
};

// GET /api/bookings/:id — get specific booking
exports.getById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('eventId')
      .populate('venueId')
      .populate('cateringId')
      .populate('decoratorId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error fetching booking.' });
  }
};

// GET /api/bookings/mine — get all bookings for the current logged-in user
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('eventId')
      .populate('venueId')
      .populate('cateringId')
      .populate('decoratorId')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
};

// GET /api/bookings/user/:userId — get all bookings for a specific user (admin only or self)
exports.getByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const bookings = await Booking.find({ userId })
      .populate('eventId')
      .populate('venueId')
      .populate('cateringId')
      .populate('decoratorId')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
};

// PATCH /api/bookings/:id/cancel — cancel a booking
exports.cancel = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Free up the venue date
    const venue = await Venue.findById(booking.venueId);
    if (venue) {
      const cancelDate = new Date(booking.eventDate).toISOString().split('T')[0];
      venue.bookedDates = venue.bookedDates.filter(bd => 
        new Date(bd.date).toISOString().split('T')[0] !== cancelDate
      );
      await venue.save();
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error cancelling booking.' });
  }
};
