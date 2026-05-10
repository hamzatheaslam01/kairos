const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventName: {
    type: String,
    trim: true,
    default: ''
  },
  eventType: {
    type: String,
    enum: ['Wedding', 'Birthday', 'Corporate', 'Gala', 'Private Dinner', 'Seminar', 'Exhibition', 'Charity', 'Other'],
    required: [true, 'Event type is required']
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget must be positive']
  },
  guestCount: {
    type: Number,
    required: [true, 'Guest count is required'],
    min: [1, 'Guest count must be at least 1']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  eventDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['planning', 'quoted', 'booked', 'completed', 'cancelled'],
    default: 'planning'
  },
  preferences: {
    vibe: { type: String },
    mustHave: { type: String },
    specialNotes: { type: String },
    tags: [{ type: String }]
  }
}, {
  timestamps: true
});

eventSchema.index({ userId: 1 });

module.exports = mongoose.model('Event', eventSchema);
