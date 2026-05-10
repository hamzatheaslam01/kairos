const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['decoration', 'photography', 'entertainment', 'other'],
    required: [true, 'Category is required'],
    default: 'decoration'
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  pricingType: {
    type: String,
    enum: ['flat', 'per_person'],
    default: 'flat'
  },
  capacity: {
    type: Number,
    default: null
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
  images: [{
    type: String
  }],
  specialties: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

vendorSchema.index({ category: 1, city: 1, isActive: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
