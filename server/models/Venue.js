const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Price per day is required'],
    min: [0, 'Price must be positive']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  description: {
    type: String
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  ownCatering: {
    type: Boolean,
    default: false
  },
  cateringDetails: {
    menuOptions: [{
      name: { type: String },
      pricePerPerson: { type: Number },
      description: { type: String },
      items: [{ type: String }]
    }],
    cuisineTypes: [{ type: String }],
    maxCapacity: { type: Number }
  },
  bookedDates: [{
    date: { type: Date },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
  }]
}, {
  timestamps: true
});

// Index for common queries
venueSchema.index({ city: 1, isActive: 1 });
venueSchema.index({ pricePerDay: 1 });

module.exports = mongoose.model('Venue', venueSchema);
