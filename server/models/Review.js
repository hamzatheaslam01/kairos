const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  targetType: {
    type: String,
    enum: ['venue', 'catering', 'vendor'],
    required: [true, 'Review target type is required']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Review target ID is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviewText: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ userId: 1 });
// Prevent duplicate reviews - Disabled to allow seeded reviews
// reviewSchema.index({ userId: 1, bookingId: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
