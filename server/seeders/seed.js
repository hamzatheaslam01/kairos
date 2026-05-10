require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { User, Venue, CateringService, Vendor, Event, Booking, Quotation, Deal, Review } = require('../models');

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kairos';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    // Clear only system data (Venues, Catering, Vendors, Deals)
    // We preserve Users, Events, Bookings, and Reviews to maintain persistence
    await Venue.deleteMany({});
    await CateringService.deleteMany({});
    await Vendor.deleteMany({});
    await Deal.deleteMany({});
    console.log('Cleared system data (Venues, Catering, Vendors, Deals)');


    // ── 1. Create/Update Users (Upsert to avoid duplicates and maintain persistence) ──
    const admin = await User.findOneAndUpdate(
      { email: 'admin@kairos.com' },
      { 
        fullName: 'Admin User',
        passwordHash: 'admin123',
        role: 'admin',
        phone: '03001234567'
      },
      { upsert: true, new: true }
    );

    const user1 = await User.findOneAndUpdate(
      { email: 'demo@kairos.com' },
      {
        fullName: 'Demo User',
        passwordHash: 'demo123',
        role: 'user',
        phone: '03009876543'
      },
      { upsert: true, new: true }
    );
    console.log('Created/Updated core users');


    // ── 2. Create Venues ──
    const venuesData = [
      {
        name: 'Pearl Continental Marquee', city: 'Lahore', address: 'Shahrah-e-Quaid-e-Azam, Lahore',
        capacity: 1000, pricePerDay: 500000, rating: 4.8, description: 'An architectural masterpiece offering a grand ambiance with state-of-the-art climate control and bespoke chandelier lighting.',
        amenities: ['Valet', 'Bridal Room', 'Backup Generator', 'VIP Lounge'],
        ownCatering: true,
        cateringDetails: {
          menuOptions: [
            { name: 'Royal Mutton Feast', pricePerPerson: 3500, description: 'Hand-picked organic ingredients featuring our signature Mutton Karahi and slow-cooked Biryani.', items: ['Mutton', 'Chicken', 'Dessert'] },
            { name: 'Imperial Seafood Spread', pricePerPerson: 5500, description: 'Exquisite seafood selection including Arabian Sea Prawns and Pan-seared Fish.', items: ['Mutton', 'Chicken', 'Seafood'] }
          ],
          cuisineTypes: ['Pakistani', 'Continental'],
          maxCapacity: 1000
        }
      },
      {
        name: 'Serena Hotel Banquet', city: 'Islamabad', address: 'Khayaban-e-Suhrawardy, Islamabad',
        capacity: 800, pricePerDay: 850000, rating: 4.9, description: 'The pinnacle of luxury in the capital. Hand-carved woodwork and intricate marble flooring set the stage for elite gatherings.',
        ownCatering: true,
        cateringDetails: {
          menuOptions: [
            { name: 'Diplomatic Gala', pricePerPerson: 4500, items: ['Mutton Qorma', 'Chicken Boti', 'Zarda'] },
            { name: 'Embassy Selection', pricePerPerson: 6500, items: ['Thai Green Curry', 'Beef Wellington', 'Chocolate Fondant'] }
          ],
          cuisineTypes: ['Pakistani', 'International'],
          maxCapacity: 800
        }
      },
      { name: 'Garrison Golf Country Club', city: 'Lahore', capacity: 1500, pricePerDay: 350000, rating: 4.6, ownCatering: false, description: 'Vast lush green lawns perfect for winter weddings and large scale corporate retreats.' },
      { name: 'Mövenpick Hotel', city: 'Karachi', capacity: 600, pricePerDay: 650000, rating: 4.7, ownCatering: true, description: 'Centrally located luxury with world-class hospitality standards and Swiss-inspired dessert bars.', cateringDetails: { menuOptions: [{ name: 'Harbour View Menu', pricePerPerson: 4000, items: ['Fish', 'Chicken', 'Salads'] }], cuisineTypes: ['International'], maxCapacity: 600 } },
      { name: 'Bahria Grand Hotel', city: 'Lahore', capacity: 500, pricePerDay: 400000, rating: 4.5, ownCatering: false, description: 'Parisian-themed hotel offering a boutique experience for intimate and sophisticated events.' },
      { name: 'Avari Towers', city: 'Karachi', capacity: 700, pricePerDay: 580000, rating: 4.6, ownCatering: false, description: 'An iconic Karachi landmark offering panoramic city views and versatile event spaces.' },
      { name: 'The Monal Banquet', city: 'Islamabad', capacity: 400, pricePerDay: 300000, rating: 4.8, ownCatering: false, description: 'Nestled in the Margalla Hills, providing the most breathtaking backdrop for your special moments.' },
      { name: 'Beach Luxury Hotel', city: 'Karachi', capacity: 1200, pricePerDay: 250000, rating: 4.4, ownCatering: false, description: 'Old-world charm with spacious waterfront lawns, ideal for large traditional gatherings.' }
    ];
    const venues = await Venue.insertMany(venuesData);
    console.log(`Created ${venues.length} venues`);

    // ── 3. Create Independent Catering ──
    const cateringData = [
      { name: 'Hanif Rajput Caterers', city: 'Islamabad', pricingType: 'per_person', pricePerPerson: 2800, cuisineTypes: ['Pakistani', 'Mughlai'], rating: 4.7, description: 'Legends in Pakistani catering, famous for their authentic charcoal-cooked specialties.' },
      { name: 'Nadeem Caterers', city: 'Lahore', pricingType: 'per_person', pricePerPerson: 2200, cuisineTypes: ['Pakistani'], rating: 4.5, description: 'A Lahore staple known for consistent quality and traditional recipes passed down through generations.' },
      { name: 'Kitchen Cuisine', city: 'Lahore', pricingType: 'per_person', pricePerPerson: 3500, cuisineTypes: ['Continental', 'Desserts'], rating: 4.8, description: 'Premium European-style catering focusing on presentation and refined flavor profiles.' },
      { name: 'Student Biryani Catering', city: 'Karachi', pricingType: 'per_person', pricePerPerson: 1200, cuisineTypes: ['Sindhi Biryani'], rating: 4.3, description: 'Affordable, iconic, and flavorful. The undisputed king of biryani for casual events.' },
      { name: 'BBQ Tonight Catering', city: 'Karachi', pricingType: 'per_person', pricePerPerson: 2500, cuisineTypes: ['BBQ', 'Pakistani'], rating: 4.6, description: 'Bringing the famous flavor of Sea View to your event with live grilling stations.' },
      { name: 'The Deli', city: 'Karachi', pricingType: 'per_person', pricePerPerson: 4500, cuisineTypes: ['Gourmet', 'Fusion'], rating: 4.9, description: 'Artisanal catering for high-end corporate launches and sophisticated private dinners.' }
    ];
    const caterers = await CateringService.insertMany(cateringData);
    console.log(`Created ${caterers.length} catering services`);

    // ── 4. Create Decorators (Vendors) ──
    const vendorData = [
      { name: 'Whimsical Events', category: 'decoration', city: 'Lahore', pricingType: 'flat', price: 180000, rating: 4.8, description: 'Avant-garde floral installations and cinematic lighting designs.' },
      { name: 'Tulips Event Management', category: 'decoration', city: 'Lahore', pricingType: 'flat', price: 250000, rating: 4.9, description: 'The gold standard for luxury decor, specializing in bespoke structural setups.' },
      { name: 'Finesse Decor', category: 'decoration', city: 'Karachi', pricingType: 'flat', price: 120000, rating: 4.5, description: 'Modern, minimalist aesthetic with a focus on geometric patterns and metallic accents.' },
      { name: 'Shadi Box', category: 'decoration', city: 'Islamabad', pricingType: 'flat', price: 150000, rating: 4.6, description: 'Curated traditional themes blended with contemporary elegance.' },
      { name: 'Carbon Events', category: 'decoration', city: 'Lahore', pricingType: 'flat', price: 400000, rating: 5.0, description: 'Ultra-luxury event design for the 1%, where imagination has no budget.' }
    ];
    const decorators = await Vendor.insertMany(vendorData);
    console.log(`Created ${decorators.length} decorators`);

    // ── 5. Create Deals ──
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const dealData = [
      {
        name: 'Lahore Grand Wedding Bundle',
        description: 'Premium package featuring Garrison Club, Nadeem Caterers, and Whimsical Events.',
        city: 'Lahore',
        eventTypes: ['Wedding'],
        discountPercent: 15,
        validUntil: nextMonth,
        bundleItems: [
          { type: 'venue', serviceId: venues.find(v => v.name === 'Garrison Golf Country Club')._id, serviceName: 'Garrison Golf Country Club' },
          { type: 'catering', serviceId: caterers.find(c => c.name === 'Nadeem Caterers')._id, serviceName: 'Nadeem Caterers' },
          { type: 'decoration', serviceId: decorators.find(d => d.name === 'Whimsical Events')._id, serviceName: 'Whimsical Events' }
        ]
      },
      {
        name: 'Capital Corporate Elite',
        description: 'Sophisticated setup with Monal Banquet and Hanif Rajput Catering.',
        city: 'Islamabad',
        eventTypes: ['Corporate'],
        discountPercent: 12,
        validUntil: nextMonth,
        bundleItems: [
          { type: 'venue', serviceId: venues.find(v => v.name === 'The Monal Banquet')._id, serviceName: 'The Monal Banquet' },
          { type: 'catering', serviceId: caterers.find(c => c.name === 'Hanif Rajput Caterers')._id, serviceName: 'Hanif Rajput Caterers' }
        ]
      }
    ];
    await Deal.insertMany(dealData);
    console.log(`Created ${dealData.length} deals`);


    // ── 6. Create Sample Event & Booking (Only if no bookings exist) ──
    const existingBookingCount = await Booking.countDocuments();
    if (existingBookingCount === 0) {
      const event = await Event.create({
        userId: user1._id,
        eventType: 'Wedding',
        eventName: 'Ali & Fatima Wedding',
        budget: 1500000,
        guestCount: 500,
        city: 'Lahore',
        status: 'booked'
      });

      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 14);

      const booking = await Booking.create({
        userId: user1._id,
        eventId: event._id,
        venueId: venues[0]._id, // PC (has own catering)
        useVenueCatering: true,
        venueCateringMenuIndex: 0,
        decoratorId: decorators[0]._id,
        eventDate: bookingDate,
        status: 'confirmed',
        totalPrice: venues[0].pricePerDay + (3500 * 500) + decorators[0].price
      });

      await Venue.findByIdAndUpdate(venues[0]._id, {
        $push: { bookedDates: { date: bookingDate, bookingId: booking._id } }
      });

      await Review.create({
        userId: user1._id,
        bookingId: booking._id,
        targetType: 'venue',
        targetId: venues[0]._id,
        rating: 5,
        reviewText: 'Amazing experience!'
      });

      console.log('Created sample event, booking, and review');
    } else {
      console.log('Skipping sample event creation (bookings already exist)');
    }


    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
