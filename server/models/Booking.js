const mongoose = require('mongoose');

function generateBookingRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KRS-${code}`;
}

const bookingSchema = new mongoose.Schema({
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
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    default: null
  },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  cateringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CateringService',
    default: null
  },
  useVenueCatering: {
    type: Boolean,
    default: false
  },
  venueCateringMenuIndex: {
    type: Number,
    default: null
  },
  decoratorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'complete'],
    default: 'pending'
  },
  bookingRef: {
    type: String,
    unique: true
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

bookingSchema.index({ userId: 1 });

// Generate unique booking reference before save
bookingSchema.pre('save', async function(next) {
  if (!this.bookingRef) {
    let ref;
    let exists = true;
    const Booking = mongoose.model('Booking');
    while (exists) {
      ref = generateBookingRef();
      const found = await Booking.findOne({ bookingRef: ref });
      exists = !!found;
    }
    this.bookingRef = ref;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
