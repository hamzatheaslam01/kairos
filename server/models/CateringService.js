const mongoose = require('mongoose');

const cateringServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Catering service name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  pricePerPerson: {
    type: Number,
    default: null
  },
  flatPrice: {
    type: Number,
    default: null
  },
  pricingType: {
    type: String,
    enum: ['per_person', 'flat'],
    required: true,
    default: 'per_person'
  },
  cuisineTypes: [{
    type: String
  }],
  menuPackages: [{
    name: { type: String },
    price: { type: Number },
    items: [{ type: String }],
    description: { type: String }
  }],
  capacity: {
    type: Number
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
  },
  linkedVenueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    default: null
  }
}, {
  timestamps: true
});

cateringServiceSchema.index({ city: 1, isActive: 1 });

// Helper to get effective price for a given guest count
cateringServiceSchema.methods.getEffectivePrice = function(guestCount) {
  if (this.pricingType === 'per_person') {
    return (this.pricePerPerson || 0) * guestCount;
  }
  return this.flatPrice || 0;
};

module.exports = mongoose.model('CateringService', cateringServiceSchema);
