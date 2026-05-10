const mongoose = require('mongoose');
const { Review, Deal, Venue, Vendor, CateringService, User } = require('./models');

const MONGO_URI = 'mongodb://localhost:27017/kairos';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Seed Reviews
    console.log('Seeding reviews...');
    const users = await User.find({ role: 'user' });
    const venues = await Venue.find();
    const vendors = await Vendor.find();
    const caterers = await CateringService.find();

    const reviewTexts = [
      "Exceptional service and attention to detail. Highly recommended!",
      "The atmosphere was perfect and the staff was very professional.",
      "A truly timeless experience. Everything was handled perfectly.",
      "Exceeded our expectations in every way. The best in the city.",
      "Professional, efficient, and elegant. We couldn't be happier.",
      "The food was delicious and the presentation was stunning.",
      "Transformative experience. They really understood our vision.",
      "Flawless execution from start to finish. Thank you KAIROS!",
      "A bit pricey but absolutely worth every rupee.",
      "The best event we've ever hosted. Everyone was impressed."
    ];

    const reviews = [];

    // Seed 2-3 reviews for each venue
    for (const venue of venues) {
      for (let i = 0; i < 2; i++) {
        reviews.push({
          userId: users[Math.floor(Math.random() * users.length)]._id,
          targetType: 'venue',
          targetId: venue._id,
          rating: 4 + Math.floor(Math.random() * 2), // 4 or 5 stars
          reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          isPublic: true
        });
      }
    }

    // Seed reviews for vendors
    for (const vendor of vendors) {
      reviews.push({
        userId: users[Math.floor(Math.random() * users.length)]._id,
        targetType: 'vendor',
        targetId: vendor._id,
        rating: 4 + Math.floor(Math.random() * 2),
        reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        isPublic: true
      });
    }

    // Seed reviews for caterers
    for (const caterer of caterers) {
      reviews.push({
        userId: users[Math.floor(Math.random() * users.length)]._id,
        targetType: 'catering',
        targetId: caterer._id,
        rating: 4 + Math.floor(Math.random() * 2),
        reviewText: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        isPublic: true
      });
    }

    await Review.deleteMany({ bookingId: null }); // Clear old seeded reviews
    await Review.insertMany(reviews);
    console.log(`Inserted ${reviews.length} reviews.`);

    // 2. Seed Deals
    console.log('Seeding deals...');
    const deals = [
      {
        name: "LUMIERE WEDDING SUITE",
        description: "Full venue, premium catering, and bespoke decor with 20% savings.",
        discountPercent: 20,
        validUntil: new Date('2024-12-31'),
        city: "Lahore",
        eventTypes: ["Wedding"],
        isActive: true
      },
      {
        name: "CORPORATE EXCELLENCE",
        description: "Sophisticated corporate planning with complimentary AV and 15% off catering.",
        discountPercent: 15,
        validUntil: new Date('2024-12-31'),
        city: "Karachi",
        eventTypes: ["Corporate"],
        isActive: true
      },
      {
        name: "SIGNATURE GALA BUNDLE",
        description: "Elite gala package including priority booking and 25% discount.",
        discountPercent: 25,
        validUntil: new Date('2024-12-31'),
        city: "Islamabad",
        eventTypes: ["Gala"],
        isActive: true
      },
      {
        name: "MEMORIAL BIRTHDAY PACKAGE",
        description: "Bespoke birthday celebrations with 10% flat discount on all services.",
        discountPercent: 10,
        validUntil: new Date('2024-12-31'),
        city: "Lahore",
        eventTypes: ["Birthday"],
        isActive: true
      }
    ];

    await Deal.deleteMany({});
    await Deal.insertMany(deals);
    console.log(`Inserted ${deals.length} deals.`);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
