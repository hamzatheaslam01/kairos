const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Deal name is required'],
    trim: true
  },
  description: {
    type: String
  },
  bundleItems: [{
    type: {
      type: String,
      enum: ['venue', 'catering', 'decoration'],
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    serviceName: {
      type: String,
      required: true
    },
    originalPrice: {
      type: Number
    }
  }],
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountFlat: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  city: {
    type: String,
    trim: true
  },
  eventTypes: [{
    type: String,
    enum: ['Wedding', 'Birthday', 'Corporate', 'Gala', 'Private Dinner', 'Seminar', 'Exhibition', 'Charity', 'Other']
  }],
  minBudget: {
    type: Number,
    default: 0
  },
  maxBudget: {
    type: Number,
    default: Infinity
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

dealSchema.index({ isActive: 1, validUntil: 1 });
dealSchema.index({ city: 1 });

module.exports = mongoose.model('Deal', dealSchema);
