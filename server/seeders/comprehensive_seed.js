require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Venue, CateringService, Vendor, Event, Booking, Quotation, Deal, Review } = require('../models');

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];
const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Gala', 'Private Dinner', 'Seminar', 'Exhibition', 'Charity', 'Other'];

const cityImages = {
    'Karachi': 'https://images.unsplash.com/photo-1623846736569-1d90cba76d65?q=80&w=1000&auto=format&fit=crop',
    'Lahore': 'https://images.unsplash.com/photo-1595183401524-738927877022?q=80&w=1000&auto=format&fit=crop',
    'Islamabad': 'https://images.unsplash.com/photo-1627440439601-0d362f6236b3?q=80&w=1000&auto=format&fit=crop',
    'Rawalpindi': 'https://images.unsplash.com/photo-1605374465355-6b3a985e926a?q=80&w=1000&auto=format&fit=crop',
    'Faisalabad': 'https://images.unsplash.com/photo-1587502537104-aac10f5fb6f7?q=80&w=1000&auto=format&fit=crop',
    'Multan': 'https://images.unsplash.com/photo-1597843796322-2503233869d8?q=80&w=1000&auto=format&fit=crop',
    'Peshawar': 'https://images.unsplash.com/photo-1560100067-17865c1979b0?q=80&w=1000&auto=format&fit=crop'
};

const venuePool = [
    // Luxury & Ultra Luxury
    { name: 'Royal Palm Golf & Country Club', vibes: ['Opulent Luxury', 'Elegant'], tags: ['Outdoor', 'Golf Course', 'Valet', 'AC'], desc: 'A majestic venue offering breathtaking views of lush golf courses and world-class hospitality.' },
    { name: 'Serena Hotel - Sheesh Mahal', vibes: ['Heritage Traditional', 'Opulent Luxury'], tags: ['Architecture', 'Handicraft', 'VIP Protocol'], desc: 'The pinnacle of Pakistani hospitality, featuring intricate woodwork and regal architecture.' },
    { name: 'Mövenpick Grand Ballroom', vibes: ['Opulent Luxury', 'Elegant'], tags: ['Swiss Quality', 'Central Location', 'Elite Clientele'], desc: 'Swiss excellence in the heart of the city, perfect for high-profile weddings and corporate galas.' },
    { name: 'The Nishat Hotel - Emporium', vibes: ['Opulent Luxury', 'Modern Minimalist'], tags: ['Luxury', 'Boutique', 'Smart Lighting'], desc: 'A modern masterpiece of luxury, offering state-of-the-art facilities and bespoke service.' },

    // Premium
    { name: 'Faletti\'s Heritage Hall', vibes: ['Heritage Traditional', 'Elegant'], tags: ['Heritage', 'Historic', 'Ballroom'], desc: 'Experience the charm of a bygone era in this beautifully preserved colonial-style hotel.' },
    { name: 'Avari Towers Rooftop', vibes: ['Elegant', 'Corporate'], tags: ['City View', 'Executive Lounge', 'High Speed Wifi'], desc: 'Sleek and professional venue with stunning panoramic views of the metropolitan skyline.' },
    { name: 'Marriott Crystal Ballroom', vibes: ['Corporate', 'Opulent Luxury'], tags: ['Diplomatic Enclave', 'Secure', 'International'], desc: 'The preferred choice for international delegates and high-end corporate summits.' },
    { name: 'Pearl Continental Grand', vibes: ['Elegant', 'Corporate'], tags: ['Legendary Service', 'Large Capacity'], desc: 'A legendary name in hospitality, offering grand spaces for massive celebrations.' },

    // Standard
    { name: 'Majestic Event Center', vibes: ['Wedding', 'Gala'], tags: ['Crystal Chandeliers', 'Bridal Suite', 'Red Carpet'], desc: 'A purpose-built marquee offering luxury aesthetics at a competitive price point.' },
    { name: 'Jacaranda Family Club', vibes: ['Gala', 'Wedding'], tags: ['Modern', 'Family Friendly', 'Large Capacity'], desc: 'A versatile club setting ideal for community events and large family gatherings.' },
    { name: 'Margalla Hotel Gardens', vibes: ['Elegant', 'Corporate'], tags: ['Mountain View', 'Peaceful', 'Lush Green'], desc: 'Beautiful outdoor gardens set against the backdrop of the serene Margalla hills.' },
    { name: 'Dreamworld Resort Oasis', vibes: ['Gala', 'Other'], tags: ['Resort', 'Water Park', 'Spacious'], desc: 'A fun and vibrant resort setting perfect for unconventional celebrations and retreats.' },

    // Starter
    { name: 'Community Center Alpha', vibes: ['Modern Minimalist', 'Standard'], tags: ['Affordable', 'Clean', 'Essential'], desc: 'A clean and practical space designed for budget-conscious but meaningful celebrations.' },
    { name: 'The Local Bistro Garden', vibes: ['Private Dinner', 'Birthday'], tags: ['Cosy', 'Casual', 'Hearty'], desc: 'An intimate garden setting perfect for birthdays and small private dinners.' },
    { name: 'Skyline Community Hall', vibes: ['Birthday', 'Seminar'], tags: ['Value', 'Accessible', 'Functional'], desc: 'Practical hall with all basic amenities, located in the heart of the residential district.' }
];


const cateringPool = [
    { name: 'Hanif Rajput', cuisine: ['Pakistani', 'Mughlai', 'BBQ'], tags: ['Legendary', 'High Volume', 'Elite Service'], desc: 'The gold standard of Pakistani event catering, known for their consistency and royal taste.' },
    { name: 'Kitchen Cuisine', cuisine: ['Continental', 'Bakery', 'Desserts'], tags: ['Premium', 'Gourmet', 'Finesse'], desc: 'Premium gourmet catering specializing in international cuisines and exquisite dessert bars.' },
    { name: 'Kolachi Gourmet', cuisine: ['Spirit of Karachi', 'BBQ', 'Seafood'], tags: ['Oceanic Vibe', 'Iconic', 'Premium'], desc: 'Bringing the spirit of Karachi to your event with their world-famous BBQ and seafood.' },
    { name: 'Lal Qila', cuisine: ['Mughlai', 'Traditional'], tags: ['Theme Buffet', 'Historic Ambience'], desc: 'A themed catering experience that takes you back to the era of the Mughal Emperors.' },
    { name: 'Copper Kettle', cuisine: ['Continental', 'Fast Food'], tags: ['Western Vibe', 'Young Crowd', 'Fusion'], desc: 'Trendy and fun catering perfect for corporate lunches and youthful private parties.' },
    { name: 'Bundu Khan', cuisine: ['Desi', 'BBQ'], tags: ['Halwa Puri Specialist', 'Traditional'], desc: 'Authentic traditional flavors that have been a staple of Pakistani celebrations for decades.' },
    { name: 'Gourmet Catering', cuisine: ['Pakistani', 'Chinese', 'Continental'], tags: ['Affordable', 'Reliable', 'Mass Market'], desc: 'Quality catering that offers the best value for money for large-scale events.' },
    { name: 'The Local Kitchen', cuisine: ['Home Cooked', 'Traditional'], tags: ['Simple', 'Budget', 'Clean'], desc: 'Hearty, home-style meals prepared with love and high standards of hygiene.' }
];


const vendorPool = [
    { name: 'Whimsical Events', category: 'decoration', tags: ['Modern', 'Floral', 'Themed'], desc: 'Creating magical spaces with a focus on modern floral arrangements and artistic themes.' },
    { name: 'Tulips Events', category: 'decoration', tags: ['Luxury', 'Grandeur', 'Traditional'], desc: 'Specializing in grand, high-end decor that leaves a lasting impression.' },
    { name: 'Irfan Ahson', category: 'photography', tags: ['Elite', 'Bridal', 'Fine Art'], desc: 'World-renowned for capturing the soul of weddings through a fine-art lens.' },
    { name: 'Da Artist', category: 'photography', tags: ['Cinematic', 'Modern', 'International'], desc: 'Cinematic storytelling that turns your special moments into a motion picture.' },
    { name: 'Harmony Entertainment', category: 'entertainment', tags: ['Live Band', 'Sound System', 'Sufi Night'], desc: 'Providing world-class live music and high-fidelity sound systems for every occasion.' },
    { name: 'Echo Sound', category: 'entertainment', tags: ['Corporate Audio', 'Mic Support'], desc: 'The gold standard for corporate audio and professional conference setups.' },
    { name: 'Budget Decor', category: 'decoration', tags: ['Value', 'Simple', 'Quick'], desc: 'Elegant but simple decor solutions designed for budget-conscious celebrations.' }
];


const unsplashImages = {
    venue: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1541336032412-2048a678540d?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop'
    ],
    catering: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1530103043960-ef38714abb15?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop'
    ],
    vendor: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513273395135-c89d3ea52f40?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop'
    ]
};

async function seed() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kairos';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for HYPER-COMPREHENSIVE seeding...');

        // Clear only system data (Venues, Catering, Vendors, Deals)
        await Promise.all([
            Venue.deleteMany({}),
            CateringService.deleteMany({}),
            Vendor.deleteMany({}),
            Deal.deleteMany({})
        ]);
        console.log('Cleared system data (Venues, Catering, Vendors, Deals)');


        // 1. Create/Update Core Users
        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('admin123', salt);
        const demoHash = await bcrypt.hash('demo123', salt);

        const adminUser = await User.findOneAndUpdate(
            { email: 'admin@kairos.com' },
            {
                fullName: 'Admin KAIROS',
                passwordHash: adminHash,
                role: 'admin',
                phone: '03001234567'
            },
            { upsert: true, new: true }
        );

        const demoUser = await User.findOneAndUpdate(
            { email: 'demo@kairos.com' },
            {
                fullName: 'Demo Customer',
                passwordHash: demoHash,
                role: 'user',
                phone: '03007654321'
            },
            { upsert: true, new: true }
        );

        const currentUserCount = await User.countDocuments();
        const createdUsers = [adminUser, demoUser];

        if (currentUserCount < 10) {
            for (let i = 1; i <= 20; i++) {
                const user = new User({
                    fullName: `Elite Client ${i}`,
                    email: `client${i}@kairos.com`,
                    passwordHash: 'password123',
                    role: 'user',
                    phone: `0300${Math.floor(1000000 + Math.random() * 9000000)}`
                });
                createdUsers.push(await user.save());
            }
            console.log(`Created ${createdUsers.length - 2} additional elite users`);
        } else {
            console.log('Users already exist, skipping bulk user creation');
        }


        // 2. Create Venues
        const venues = [];
        for (const city of cities) {
            for (const vp of venuePool) {
                const isLuxury = vp.vibes.includes('Opulent Luxury');
                const isPremium = vp.vibes.includes('Elegant') && !isLuxury;
                const isStarter = vp.tags.includes('Affordable') || vp.tags.includes('Value');

                let pricePerDay = 30000 + Math.floor(Math.random() * 50000); // Default Starter
                if (isLuxury) pricePerDay = 1500000 + Math.floor(Math.random() * 3500000);
                else if (isPremium) pricePerDay = 500000 + Math.floor(Math.random() * 1000000);
                else if (!isStarter) pricePerDay = 150000 + Math.floor(Math.random() * 350000);

                const capacity = isStarter ? (50 + Math.floor(Math.random() * 150)) : (200 + Math.floor(Math.random() * 1800));
                const rating = 3.5 + Math.random() * 1.5;
                const ownCatering = Math.random() > 0.4;

                const cateringDetails = ownCatering ? {
                    menuOptions: [
                        { name: 'Standard Package', pricePerPerson: 1200 + Math.floor(Math.random() * 800), items: ['Chicken Biryani', 'Korma', 'Raita', 'Salad', 'Kheer'], description: 'Our most popular traditional menu.' },
                        { name: 'Royal Feast', pricePerPerson: 3000 + Math.floor(Math.random() * 4000), items: ['Mutton Kunna', 'Grilled Fish', 'Reshmi Kabab', 'Assorted Desserts'], description: 'A lavish spread for distinguished guests.' }
                    ],
                    cuisineTypes: ['Pakistani', 'Continental', 'Chinese'].slice(0, 2 + Math.floor(Math.random() * 2)),
                    maxCapacity: capacity
                } : null;

                venues.push({
                    name: `${vp.name} - ${city}`,
                    city,
                    address: `${Math.floor(Math.random() * 200)}, Sector ${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}, ${city}`,
                    capacity,
                    pricePerDay,
                    rating: Number(rating.toFixed(1)),
                    description: vp.desc || `An exquisite destination for ${vp.vibes.join(' & ')} events.`,
                    amenities: [...vp.tags, 'Backup Generator', 'Parking', 'AC', 'Security'],
                    images: [unsplashImages.venue[Math.floor(Math.random() * unsplashImages.venue.length)], unsplashImages.venue[Math.floor(Math.random() * unsplashImages.venue.length)]],
                    ownCatering,
                    cateringDetails,
                    isActive: true
                });

            }
        }
        const createdVenues = await Venue.insertMany(venues);
        console.log(`Created ${createdVenues.length} high-end venues across ${cities.length} cities`);

        // 3. Create Catering Services
        const caterers = [];
        for (const city of cities) {
            for (const cp of cateringPool) {
                const pricePerPerson = 1200 + Math.floor(Math.random() * 4500);
                const rating = 4.2 + Math.random() * 0.8;

                caterers.push({
                    name: `${cp.name} (${city})`,
                    city,
                    pricingType: 'per_person',
                    pricePerPerson,
                    cuisineTypes: cp.cuisine,
                    rating: Number(rating.toFixed(1)),
                    specialties: [...cp.tags, 'Signature Desserts', 'Live Stations'],
                    description: `${cp.name} is a premier catering choice in ${city}, specializing in ${cp.cuisine.join(', ')}.`,
                    images: [unsplashImages.catering[Math.floor(Math.random() * unsplashImages.catering.length)]]
                });
            }
        }
        const createdCaterers = await CateringService.insertMany(caterers);
        console.log(`Created ${createdCaterers.length} premium catering services`);

        // 4. Create Vendors (Decorators etc)
        const vendors = [];
        for (const city of cities) {
            for (const vnp of vendorPool) {
                const price = 50000 + Math.floor(Math.random() * 750000);
                const rating = 3.9 + Math.random() * 1.1;

                vendors.push({
                    name: `${vnp.name} - ${city}`,
                    category: vnp.category,
                    city,
                    price,
                    pricingType: 'flat',
                    rating: Number(rating.toFixed(1)),
                    specialties: [...vnp.tags, 'High-End Setup', 'Professional Crew'],
                    description: `Award winning ${vnp.category} services in ${city} by ${vnp.name}.`,
                    images: [unsplashImages.vendor[Math.floor(Math.random() * unsplashImages.vendor.length)]]
                });
            }
        }
        const createdVendors = await Vendor.insertMany(vendors);
        console.log(`Created ${createdVendors.length} professional vendors`);

        // 5. Create Deals
        const deals = [];
        for (let i = 0; i < 20; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const venue = createdVenues.find(v => v.city === city) || createdVenues[0];
            const caterer = createdCaterers.find(c => c.city === city) || createdCaterers[0];
            const vendor = createdVendors.find(v => v.city === city && v.category === 'decoration') || createdVendors[0];

            const validUntil = new Date();
            validUntil.setMonth(validUntil.getMonth() + 2);

            deals.push({
                name: `${city} Luxury Package`,
                description: `Unlock 15% off on a combined booking of ${venue.name} and ${caterer.name}.`,
                city,
                eventTypes: ['Wedding', 'Gala', 'Corporate'],
                discountPercent: 15,
                validUntil,
                bundleItems: [
                    { type: 'venue', serviceId: venue._id, serviceName: venue.name },
                    { type: 'catering', serviceId: caterer._id, serviceName: caterer.name },
                    { type: 'decoration', serviceId: vendor._id, serviceName: vendor.name }
                ]
            });
        }
        await Deal.insertMany(deals);
        console.log(`Created 20 exclusive deals`);

        // 6. Create Random Events, Bookings & Reviews for Realism (Only if no bookings exist)
        const existingBookingCount = await Booking.countDocuments();
        if (existingBookingCount === 0) {
            for (let i = 2; i < createdUsers.length; i++) {
                const user = createdUsers[i];
                const city = cities[Math.floor(Math.random() * cities.length)];
                const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

                const event = await Event.create({
                    userId: user._id,
                    eventType,
                    eventName: `${user.fullName}'s Grand ${eventType}`,
                    budget: 800000 + Math.floor(Math.random() * 5000000),
                    guestCount: 200 + Math.floor(Math.random() * 600),
                    city,
                    status: i % 4 === 0 ? 'planning' : 'booked',
                    preferences: {
                        vibe: ['Elegant', 'Modern Minimalist', 'Opulent Luxury'][Math.floor(Math.random() * 3)],
                        tags: ['Outdoor', 'Halal', 'Live Music'].slice(0, 2)
                    }
                });

                if (event.status === 'booked') {
                    const venue = createdVenues.find(v => v.city === city) || createdVenues[0];
                    const bookingDate = new Date();
                    bookingDate.setDate(bookingDate.getDate() + (Math.random() > 0.5 ? 45 : -45));

                    const booking = await Booking.create({
                        userId: user._id,
                        eventId: event._id,
                        venueId: venue._id,
                        eventDate: bookingDate,
                        status: 'confirmed',
                        totalPrice: venue.pricePerDay + 200000
                    });

                    if (bookingDate < new Date()) {
                        await Review.create({
                            userId: user._id,
                            bookingId: booking._id,
                            targetType: 'venue',
                            targetId: venue._id,
                            rating: 4 + Math.floor(Math.random() * 2),
                            reviewText: 'Exceptional experience, KAIROS AI really delivered on the strategy!'
                        });
                    }
                }
            }
            console.log('Created realistic interaction history');
        } else {
            console.log('Skipping interaction history seeding (bookings already exist)');
        }


        console.log('✅ HYPER-COMPREHENSIVE SEEDING COMPLETE!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
