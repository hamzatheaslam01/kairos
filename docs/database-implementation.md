# Database Implementation Documentation

## 1. Database Strategy and Design Philosophy
KAIROS uses MongoDB (document model) with Mongoose schemas to balance:
- flexible event/vendor data representation
- strict field validation where business correctness matters
- rapid iteration for feature-heavy product workflows

Design philosophy:
- keep entities close to domain language (Event, Venue, Booking, Quotation)
- enforce essential constraints at schema level
- enforce cross-entity business rules at service/controller level

## 2. Connection Management
Connection module: `server/config/database.js`

Behavior:
- reads `MONGODB_URI` from environment
- fallback URI: `mongodb://localhost:27017/kairos`
- logs connected host on success
- subscribes to `error` and `disconnected` events
- exits process if initial connect fails

Viva point:
- fail-fast startup prevents app running in a half-ready state.

## 3. Collection Inventory
All model exports are unified in `server/models/index.js`.

Primary collections:
- users
- events
- venues
- cateringservices
- vendors
- bookings
- quotations
- deals
- reviews

## 4. Detailed Entity Documentation

### 4.1 User Entity
Model: `models/User.js`

Core fields:
- fullName
- email (unique)
- passwordHash
- role (`user` or `admin`)
- phone

Important behavior:
- pre-save hook hashes password with bcrypt when modified
- instance method `comparePassword` handles secure login checks
- custom `toJSON` removes password hash from serialized responses

### 4.2 Event Entity
Model: `models/Event.js`

Core fields:
- user reference
- event metadata (type, name, city, date)
- planning constraints (budget, guestCount)
- lifecycle status (`planning`, `quoted`, `booked`, `completed`, `cancelled`)
- preference payload (vibe, tags, notes)

Index:
- `{ userId: 1 }` for fast user-centric event listing

### 4.3 Venue Entity
Model: `models/Venue.js`

Core fields:
- identity: name/city/address
- logistics: capacity, pricePerDay, rating
- content: description, amenities, images
- operation flags: isActive
- optional in-house catering details
- reservation map: `bookedDates[]`

Indexes:
- `{ city: 1, isActive: 1 }` for recommendation and catalog filtering
- `{ pricePerDay: 1 }` for budget sorting/threshold filters

### 4.4 CateringService Entity
Model: `models/CateringService.js`

Core fields:
- name/city
- pricing model (`per_person` or `flat`)
- price fields (`pricePerPerson`, `flatPrice`)
- menu/cuisine metadata
- capacity/rating/specialties/images
- optional `linkedVenueId`

Helper method:
- `getEffectivePrice(guestCount)` returns computed spend for pricing model

Index:
- `{ city: 1, isActive: 1 }`

### 4.5 Vendor Entity
Model: `models/Vendor.js`

Core fields:
- name
- category (`decoration`, `photography`, `entertainment`, `other`)
- city, price, pricingType
- capacity, rating, specialties, media
- activation flag

Index:
- `{ category: 1, city: 1, isActive: 1 }`

### 4.6 Booking Entity
Model: `models/Booking.js`

Core fields:
- references: user, event, venue, optional catering, optional decorator, optional quotation
- booking date and total price
- workflow status (`pending`, `confirmed`, `cancelled`, `complete`)
- generated `bookingRef` and admin notes

Operational hook:
- pre-save generator ensures unique human-readable reference (`KRS-XXXX`)

Index:
- `{ userId: 1 }` for fast user booking retrieval

### 4.7 Quotation Entity
Model: `models/Quotation.js`

Core fields:
- user and event references
- itemized proposed services
- subtotal, discount, total
- optional linked deal
- admin workflow state (`draft`, `sent_to_admin`, `approved`, `rejected`, `expired`)
- validity date and admin response notes

Indexes:
- `{ userId: 1 }`
- `{ status: 1 }`

### 4.8 Deal Entity
Model: `models/Deal.js`

Core fields:
- naming and description
- bundle composition
- discount scheme (percent/flat)
- validity window
- city/event applicability
- budget range constraints
- activity and usage fields

Indexes:
- `{ isActive: 1, validUntil: 1 }`
- `{ city: 1 }`

### 4.9 Review Entity
Model: `models/Review.js`

Core fields:
- reviewer (user)
- optional source booking
- polymorphic target (`targetType` + `targetId`)
- rating (1 to 5)
- free text feedback

Indexes:
- `{ targetType: 1, targetId: 1 }` for listing reviews by service
- `{ userId: 1 }` for profile/history queries

## 5. Relationship Semantics

Principal relationships:
- User 1:N Event
- User 1:N Booking
- Event 1:0..1 Booking (application-enforced)
- Booking N:1 Venue
- Booking N:0..1 CateringService
- Booking N:0..1 Vendor (decor)
- Booking 1:0..1 Quotation
- User 1:N Review

Polymorphic review design:
- `targetType` identifies domain (`venue`, `catering`, `vendor`)
- `targetId` stores referenced record id

## 6. Indexing Strategy and Query Intent

Index intent summary:
- user-centric indexes for dashboard latency
- city + active indexes for recommendation filtering
- price/status indexes for sorting and admin operations
- target indexes for review aggregation

Tradeoff:
- write cost increases with additional indexes
- read performance is significantly improved for most UI-critical endpoints

## 7. Data Integrity Enforcement Layers

### 7.1 Schema-Level Integrity
- required fields
- enums for constrained states
- min/max constraints for numeric validity
- unique constraints for identifiers like user email and booking reference

### 7.2 Application-Level Integrity
Cross-document rules are enforced in controllers/services:
- one booking per event
- venue date availability checks
- review only for booked and completed/confirmed services
- role-based access constraints

Why split integrity this way:
- schema handles single-document truth
- business workflows often need multi-document context

## 8. Booking Availability Model
Current model stores venue occupancy in:
- `Venue.bookedDates[]` with embedded `{ date, bookingId }`

Advantages:
- direct availability checks in one venue read
- simple reservation release on cancellation

Limitations:
- very large booking history can grow document size
- for very high scale, a dedicated availability collection may be preferred

## 9. Aggregations and Analytics Usage
Observed aggregation patterns:
- revenue sum by booking status
- event type frequency distribution
- review average calculations per target entity

These support:
- admin dashboard metrics
- dynamic rating updates
- strategic recommendation signals

## 10. Seeding and Test Data Philosophy
Seed files:
- `server/seeders/seed.js`
- `server/seeders/comprehensive_seed.js`
- `server/seed_data.js`

Seeding goals:
- provide deterministic admin/demo identities
- initialize catalog inventory
- produce enough sample data for recommendation and dashboard validation

## 11. Operational Considerations
- MongoDB is source of truth for business entities.
- Redis is auxiliary and non-authoritative.
- no migration framework currently; schema evolution is managed through model updates and controlled seeding.

## 12. Future Data-Layer Enhancements
1. Add optimistic concurrency/version checks on high-contention updates.
2. Introduce database transactions for booking + venue reservation writes.
3. Add compound indexes guided by production query profiling.
4. Add archival strategy for aged booking history and logs.
