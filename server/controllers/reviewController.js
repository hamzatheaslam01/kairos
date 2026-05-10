const { Review, Booking, Venue, CateringService, Vendor } = require('../models');

// POST /api/reviews
exports.create = async (req, res) => {
  try {
    const { bookingId, targetType, targetId, rating, reviewText } = req.body;

    if (!bookingId || !targetType || !targetId) {
      return res.status(400).json({ error: 'bookingId, targetType, and targetId are required.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id, status: { $in: ['confirmed', 'complete'] } });
    if (!booking) {
      return res.status(404).json({ error: 'Confirmed or completed booking not found.' });
    }

    // Verify target was part of booking
    if (targetType === 'venue' && booking.venueId.toString() !== targetId) {
      return res.status(400).json({ error: 'This venue was not part of your booking.' });
    }
    if (targetType === 'catering' && booking.cateringId?.toString() !== targetId) {
      return res.status(400).json({ error: 'This caterer was not part of your booking.' });
    }
    if (targetType === 'vendor' && booking.decoratorId?.toString() !== targetId) {
      return res.status(400).json({ error: 'This vendor was not part of your booking.' });
    }

    const existing = await Review.findOne({ userId: req.user._id, bookingId: bookingId, targetType: targetType, targetId: targetId });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this.' });
    }

    const review = new Review({
      userId: req.user._id,
      bookingId: bookingId,
      targetType: targetType,
      targetId: targetId,
      rating: parseFloat(rating),
      reviewText: reviewText || ''
    });
    await review.save();

    // Update average rating
    await updateRating(targetType, targetId);

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Duplicate review.' });
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error creating review.' });
  }
};

// GET /api/reviews/venue/:id
exports.getVenueReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ targetType: 'venue', targetId: req.params.id })
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 });
    const stats = await getStats('venue', req.params.id);
    res.json({ ...stats, reviews });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
};

// GET /api/reviews/vendor/:id
exports.getVendorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ targetType: 'vendor', targetId: req.params.id })
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 });
    const stats = await getStats('vendor', req.params.id);
    res.json({ ...stats, reviews });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
};

// GET /api/reviews/catering/:id
exports.getCateringReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ targetType: 'catering', targetId: req.params.id })
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 });
    const stats = await getStats('catering', req.params.id);
    res.json({ ...stats, reviews });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
};

// GET /api/reviews/my
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
};

async function getStats(targetType, targetId) {
  const agg = await Review.aggregate([
    { $match: { targetType, targetId: new (require('mongoose').Types.ObjectId)(targetId) } },
    { $group: { _id: null, avg_rating: { $avg: '$rating' }, total_reviews: { $sum: 1 } } }
  ]);
  const r = agg[0] || {};
  return { average_rating: r.avg_rating ? parseFloat(r.avg_rating.toFixed(1)) : null, total_reviews: r.total_reviews || 0 };
}

async function updateRating(targetType, targetId) {
  const stats = await getStats(targetType, targetId);
  if (!stats.average_rating) return;
  const Model = targetType === 'venue' ? Venue : targetType === 'catering' ? CateringService : Vendor;
  await Model.findByIdAndUpdate(targetId, { rating: stats.average_rating });
}
