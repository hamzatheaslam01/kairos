const { Booking, Event, Venue, CateringService, Vendor, User, Quotation, Deal } = require('../models');
const bcrypt = require('bcryptjs');

// GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'fullName email')
      .populate('eventId', 'eventType guestCount city budget')
      .populate('venueId', 'name city')
      .populate('cateringId', 'name')
      .populate('decoratorId', 'name')
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    console.error('Admin get bookings error:', error);
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
};

// PATCH /api/admin/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('venueId')
      .populate('cateringId')
      .populate('decoratorId');

    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    
    // Check if we're confirming a previously unconfirmed booking
    if (status === 'confirmed' && booking.status !== 'confirmed') {
      const items = [];
      if (booking.venueId) {
        items.push({
          type: 'venue',
          serviceId: booking.venueId._id,
          serviceName: booking.venueId.name,
          price: booking.venueId.pricePerDay || 0
        });
      }
      if (booking.cateringId) {
        items.push({
          type: 'catering',
          serviceId: booking.cateringId._id,
          serviceName: booking.cateringId.name,
          price: booking.totalPrice - (booking.venueId?.pricePerDay || 0) - (booking.decoratorId?.price || 0) // Estimate or calculate accurately
        });
      }
      if (booking.decoratorId) {
        items.push({
          type: 'decoration',
          serviceId: booking.decoratorId._id,
          serviceName: booking.decoratorId.name,
          price: booking.decoratorId.price || 0
        });
      }

      const quotation = new Quotation({
        userId: booking.userId,
        eventId: booking.eventId,
        items,
        subtotal: booking.totalPrice,
        total: booking.totalPrice,
        status: 'approved' // Automatically approved since admin confirmed
      });
      await quotation.save();
      booking.quotationId = quotation._id;
    }

    if (status) booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    await booking.save();

    res.json({ message: 'Booking updated', booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error updating booking.' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalUsers, totalVenues, totalVendors, totalCaterers, totalDeals] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'cancelled' }),
      User.countDocuments({ role: 'user' }),
      Venue.countDocuments(),
      Vendor.countDocuments(),
      CateringService.countDocuments(),
      Deal.countDocuments({ isActive: true })
    ]);

    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const eventTypeCounts = await Event.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);

    const pendingQuotations = await Quotation.countDocuments({ status: 'sent_to_admin' });

    res.json({
      stats: { totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalUsers, totalVenues, totalVendors, totalCaterers, totalDeals, totalRevenue, pendingQuotations },
      eventTypeCounts: eventTypeCounts.map(e => ({ type: e._id, count: e.count }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats.' });
  }
};

// ── Venue CRUD ──
exports.createVenue = async (req, res) => {
  try { const venue = new Venue(req.body); await venue.save(); res.status(201).json({ message: 'Venue created', venue }); }
  catch (error) { res.status(error.name === 'ValidationError' ? 400 : 500).json({ error: error.message }); }
};
exports.updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!venue) return res.status(404).json({ error: 'Venue not found.' });
    res.json({ message: 'Venue updated', venue });
  } catch (error) { res.status(500).json({ error: 'Server error updating venue.' }); }
};
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!venue) return res.status(404).json({ error: 'Venue not found.' });
    res.json({ message: 'Venue deactivated' });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── Venue Availability ──
exports.updateVenueAvailability = async (req, res) => {
  try {
    const { date, available } = req.body;
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Venue not found.' });
    const checkDate = new Date(date).toISOString().split('T')[0];
    if (available) {
      venue.bookedDates = venue.bookedDates.filter(bd => new Date(bd.date).toISOString().split('T')[0] !== checkDate);
    } else {
      const already = venue.bookedDates.some(bd => new Date(bd.date).toISOString().split('T')[0] === checkDate);
      if (!already) venue.bookedDates.push({ date: new Date(date), bookingId: null });
    }
    await venue.save();
    res.json({ message: `Venue ${available ? 'unblocked' : 'blocked'} for ${date}`, venue });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── Catering CRUD ──
exports.createCatering = async (req, res) => {
  try { const c = new CateringService(req.body); await c.save(); res.status(201).json({ message: 'Catering service created', catering: c }); }
  catch (error) { res.status(error.name === 'ValidationError' ? 400 : 500).json({ error: error.message }); }
};
exports.updateCatering = async (req, res) => {
  try {
    const c = await CateringService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ error: 'Not found.' });
    res.json({ message: 'Catering updated', catering: c });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.deleteCatering = async (req, res) => {
  try {
    const c = await CateringService.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!c) return res.status(404).json({ error: 'Not found.' });
    res.json({ message: 'Catering deactivated' });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── Vendor CRUD ──
exports.createVendor = async (req, res) => {
  try { const v = new Vendor(req.body); await v.save(); res.status(201).json({ message: 'Vendor created', vendor: v }); }
  catch (error) { res.status(error.name === 'ValidationError' ? 400 : 500).json({ error: error.message }); }
};
exports.updateVendor = async (req, res) => {
  try {
    const v = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!v) return res.status(404).json({ error: 'Not found.' });
    res.json({ message: 'Vendor updated', vendor: v });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.deleteVendor = async (req, res) => {
  try {
    const v = await Vendor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!v) return res.status(404).json({ error: 'Not found.' });
    res.json({ message: 'Vendor deactivated' });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── Deal CRUD ──
exports.createDeal = async (req, res) => {
  try { const d = new Deal(req.body); await d.save(); res.status(201).json({ message: 'Deal created', deal: d }); }
  catch (error) { res.status(error.name === 'ValidationError' ? 400 : 500).json({ error: error.message }); }
};
exports.updateDeal = async (req, res) => {
  try {
    const d = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!d) return res.status(404).json({ error: 'Not found.' });
    res.json({ message: 'Deal updated', deal: d });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.deleteDeal = async (req, res) => {
  try {
    const d = await Deal.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!d) return res.status(404).json({ error: 'Not found.' });
    res.json({ message: 'Deal deactivated' });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── Quotation Management ──
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate('userId', 'fullName email')
      .populate('eventId', 'eventType city budget guestCount')
      .populate('dealId', 'name discountPercent')
      .sort({ createdAt: -1 });
    res.json({ quotations });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.respondToQuotation = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected.' });
    const q = await Quotation.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quotation not found.' });
    q.status = status;
    q.adminResponse = adminResponse || '';
    await q.save();
    res.json({ message: `Quotation ${status}`, quotation: q });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── List all services (for admin panel) ──
exports.getAllVenues = async (req, res) => {
  try { const venues = await Venue.find().sort({ createdAt: -1 }); res.json({ venues }); }
  catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.getAllCatering = async (req, res) => {
  try { const caterers = await CateringService.find().sort({ createdAt: -1 }); res.json({ caterers }); }
  catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.getAllVendors = async (req, res) => {
  try { const vendors = await Vendor.find().sort({ createdAt: -1 }); res.json({ vendors }); }
  catch (error) { res.status(500).json({ error: 'Server error.' }); }
};
exports.getAllDeals = async (req, res) => {
  try { const deals = await Deal.find().sort({ createdAt: -1 }); res.json({ deals }); }
  catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

// ── Users Management ──
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { fullName, email, role, phone } = req.body;
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User updated', user });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted' });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });
    const user = new User({ fullName, email, passwordHash: password, role: role || 'user', phone });
    await user.save();
    res.status(201).json({ message: 'User created', user });
  } catch (error) { res.status(error.name === 'ValidationError' ? 400 : 500).json({ error: error.message }); }
};

// ── Cities Management (derived from venue data) ──
exports.getCities = async (req, res) => {
  try {
    const cities = await Venue.distinct('city');
    res.json({ cities: cities.filter(Boolean).sort() });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

exports.renameCity = async (req, res) => {
  try {
    const { oldCity, newCity } = req.body;
    if (!oldCity || !newCity) return res.status(400).json({ error: 'oldCity and newCity are required.' });
    const [venues, vendors, caterers, deals] = await Promise.all([
      Venue.updateMany({ city: oldCity }, { city: newCity }),
      Vendor.updateMany({ city: oldCity }, { city: newCity }),
      CateringService.updateMany({ city: oldCity }, { city: newCity }),
      Deal.updateMany({ city: oldCity }, { city: newCity })
    ]);
    res.json({ message: `City renamed from "${oldCity}" to "${newCity}"`, affected: { venues: venues.modifiedCount, vendors: vendors.modifiedCount, caterers: caterers.modifiedCount, deals: deals.modifiedCount } });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

exports.getCityStats = async (req, res) => {
  try {
    const cities = await Venue.distinct('city');
    const stats = await Promise.all(cities.filter(Boolean).map(async (city) => {
      const [venues, vendors, caterers] = await Promise.all([
        Venue.countDocuments({ city, isActive: true }),
        Vendor.countDocuments({ city, isActive: true }),
        CateringService.countDocuments({ city, isActive: true })
      ]);
      return { city, venues, vendors, caterers, total: venues + vendors + caterers };
    }));
    res.json({ cities: stats.sort((a, b) => b.total - a.total) });
  } catch (error) { res.status(500).json({ error: 'Server error.' }); }
};

