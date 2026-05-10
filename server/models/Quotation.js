const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  items: [{
    type: {
      type: String,
      enum: ['venue', 'catering', 'decoration', 'deal'],
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    serviceName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    default: null
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent_to_admin', 'approved', 'rejected', 'expired'],
    default: 'draft'
  },
  adminResponse: {
    type: String,
    default: ''
  },
  validUntil: {
    type: Date
  }
}, {
  timestamps: true
});

quotationSchema.index({ userId: 1 });
quotationSchema.index({ status: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
