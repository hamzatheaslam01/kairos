# Backend Implementation Documentation

## 1. Architectural Goal
The backend is designed as a modular Express API that supports:
- event lifecycle management
- recommendation generation (rule-based + AI-enhanced)
- booking integrity checks
- role-based admin operations
- optional AI caching and usage telemetry

The design prioritizes correctness and clarity over heavy framework abstraction.

## 2. Core Stack and Justification
- Node.js runtime
- Express server
- MongoDB via Mongoose
- JWT authentication
- bcrypt password hashing
- Groq SDK for AI features
- Redis (optional) for AI output caching

Why this composition:
- Express keeps middleware and routing explicit.
- Mongoose allows schema validation and hooks.
- JWT enables stateless auth between React client and API.
- Redis reduces repeated AI compute/token usage when enabled.

## 3. Process Bootstrap and Lifecycle
Main file: `server/server.js`

Startup order:
1. Load `.env` values.
2. Initialize express app and middleware.
3. Register route modules under `/api` namespace.
4. Expose health and root diagnostics routes.
5. Connect MongoDB (`connectDB`).
6. Initialize Groq service wrapper.
7. Initialize optional Redis cache wrapper.
8. Start HTTP listener (`PORT`, default 5001).

Shutdown behavior:
- Captures `SIGTERM` and `SIGINT`.
- Closes Redis connection gracefully before process exit.

## 4. Request Pipeline and Security Controls

### 4.1 Common Middleware
- `cors()` enables browser access from frontend dev origin.
- `express.json()` parses request payloads.

### 4.2 Authentication Middleware (`middleware/auth.js`)
Flow:
1. Require `Authorization` bearer token.
2. Verify token signature with `JWT_SECRET`.
3. Fetch user by decoded id.
4. Attach user object to `req.user`.

Failure modes:
- missing token -> 401
- expired token -> 401 with explicit message
- invalid token / user not found -> 401

### 4.3 Role Guard (`middleware/roleGuard.js`)
Flow:
1. Ensure `req.user` exists.
2. Ensure role is in allowed roles.
3. Reject with 403 on mismatch.

Critical defense point:
- admin endpoints are protected server-side even if frontend route checks are bypassed.

## 5. Route Topology

Mounted in `server/server.js`:
- `/api/auth`
- `/api/events`
- `/api/venues`
- `/api/vendors`
- `/api/catering`
- `/api/bookings`
- `/api/quotations`
- `/api/deals`
- `/api/recommendations`
- `/api/reviews`
- `/api/admin`
- `/api/ai`

Operational endpoints:
- `GET /health`
- `GET /` (HTML diagnostics)

## 6. Controller Responsibilities by Domain

### 6.1 Auth Controller
File: `controllers/authController.js`
- register user (validation + unique email enforcement)
- login user (credential verification)
- issue JWT with user identity and role
- provide current profile via `/me`

### 6.2 Event Controller
File: `controllers/eventController.js`
- create events with validated core fields
- return event list per user (newest first)
- attach booking information to each event in list endpoint
- enforce per-user ownership on detail reads

### 6.3 Recommendation Controller + Service
Controller: `controllers/recommendationController.js`
Service: `services/recommendationService.js`

Flow:
1. Validate `eventId` query parameter.
2. Ensure event belongs to authenticated user.
3. Build recommendation input from event data.
4. Execute recommendation engine.
5. Return ranked vendors and metadata.

### 6.4 Booking Controller
File: `controllers/bookingController.js`

Create booking safeguards:
- required fields check
- event ownership validation
- prevent duplicate booking per event
- verify venue activity state
- verify venue date availability
- compute total price from chosen services

Side effects:
- reserve venue date in `bookedDates`
- update event status/date if needed

Cancellation safeguards:
- only booking owner can cancel
- prevent double cancellation
- release reserved venue date

### 6.5 Catalog Controllers
- Venue controller: list/detail/availability/catering info
- Catering controller: list/detail/by venue
- Vendor controller: list/detail
- Deal controller: active/filterable deals by city/event/budget

### 6.6 Review Controller
File: `controllers/reviewController.js`

Key integrity logic:
- only confirmed/complete bookings can be reviewed
- target must match booked service
- duplicate review protection per booking + target
- aggregate rating recalculated after review creation

### 6.7 Quotation Controller
File: `controllers/quotationController.js`

Core logic:
- create quotation from selected items
- apply eligible deal discounts
- assign validity window
- update related event status to `quoted`

### 6.8 Admin Controller
File: `controllers/adminController.js`

Responsibilities:
- dashboard metrics (bookings, users, inventory, revenue)
- full management CRUD for venues/catering/vendors/deals/users
- booking state transitions and notes
- quotation responses
- city aggregation and naming operations

## 7. AI Layer Design

### 7.1 AI Endpoints
File: `routes/ai.js`
- all endpoints require auth
- production rate limiter applied only for AI routes

Endpoints:
- chat assistant
- event plan generation
- recommendation explanation
- alternatives suggestion
- budget optimization
- AI usage stats

### 7.2 Groq Wrapper
File: `services/groqService.js`

Features:
- lazy initialization from environment
- task-oriented model selection (fast/standard/complex)
- standard chat and JSON mode responses
- retry with exponential backoff
- usage metrics capture (request/token/error counts)

### 7.3 AI Recommendation Engine
File: `services/aiRecommendationService.js`

Capabilities:
- budget tier classification
- candidate slicing based on tier size
- strict schema validation of model output via Zod
- post-validation sanity enforcement (id existence, budget/capacity checks)
- optional self-correction pass when model output is inconsistent

## 8. Rule-Based Recommendation Baseline
File: `services/recommendationService.js`

Scoring formula:
- budget score weight: 40
- rating score weight: 35
- capacity score weight: 25

Behavior:
- computes deterministic fallback ranking
- attempts AI enhancement after baseline sort
- gracefully falls back to deterministic ranking on AI failure

## 9. Cache Design
File: `services/cacheService.js`

Characteristics:
- disabled unless `ENABLE_AI_CACHING=true`
- namespaced cache keys for reproducibility
- supports key get/set/delete/pattern delete/functional wrap
- on Redis failure, service downgrades without crashing API

## 10. Error Semantics
Status code usage pattern:
- 200/201 for success
- 400 for validation/user input issues
- 401 for auth failures
- 403 for role/permission denial
- 404 for missing resources
- 429 for AI rate limiting
- 500 for internal server failures

Design principle:
- provide user-safe messages, keep stack/low-level details in server logs.

## 11. Observability and Operations
- startup logs report service readiness (DB/AI/cache)
- health route returns machine-readable service state
- Groq wrapper tracks token usage and error rate
- graceful shutdown avoids dangling Redis connections

## 12. Seeding and Environment
Scripts:
- `npm run dev`
- `npm run start`
- `npm run seed`

Seed modules:
- `server/seeders/seed.js`
- `server/seeders/comprehensive_seed.js`
- `server/seed_data.js`

## 13. Improvement Backlog
1. Add centralized request validation schemas for all controllers.
2. Add structured logging and request correlation ids.
3. Add transactional safeguards around booking + venue reserve writes.
4. Add integration tests for critical flows (auth, booking, admin moderation, AI fallback).
