# Frontend Implementation Documentation

## 1. Scope and Purpose
This document explains how the KAIROS frontend is implemented, why core design choices were made, how data flows through the client, and what tradeoffs exist. It is designed for viva defense where implementation depth is expected.

## 2. Frontend Stack and Rationale
- Framework: React 19
- Build tooling: Vite 8
- Router: react-router-dom 7
- Styling: Tailwind CSS + custom theme tokens
- UI behavior style: utility-first classes + lightweight component composition
- Networking: browser native `fetch`

Why this stack:
- Vite gives fast HMR and low-friction local development.
- React Router provides route guards with minimal complexity.
- Tailwind theme extension enabled a unified visual language without adding a heavy design system dependency.
- Native fetch kept runtime bundle simple and reduced abstraction overhead.

Primary files:
- `client/src/main.jsx`
- `client/src/App.jsx`
- `client/tailwind.config.js`
- `client/src/index.css`

## 3. Bootstrapping and Runtime Entry

### 3.1 Root Mount
`client/src/main.jsx` mounts `App` inside React `StrictMode`:
- Ensures stricter lifecycle checks in development.
- Helps expose side-effect bugs early.

### 3.2 App Root Responsibilities
`client/src/App.jsx` is responsible for:
- auth context initialization and persistence
- route definition
- top navigation visibility behavior
- role-aware navigation protection
- global floating AI assistant mount

## 4. Authentication Model on Frontend

### 4.1 State Model
Auth context contains:
- `token`
- `user` with `{ id, role, fullName }`
- methods: `login`, `logout`

### 4.2 Token Persistence
- Token is stored in localStorage under `token`.
- On app load / token change, payload is decoded client-side to derive role and display identity.

### 4.3 Guard Behavior
Protected routes use inline checks:
- Unauthenticated users are redirected to `/auth`.
- Admin route verifies `user.role === 'admin'`.

Security note for viva:
- Frontend role checks are only UX-level gating.
- Real authorization is enforced by backend middleware.

## 5. Route Map and User Journeys

Public routes:
- `/` -> Hero landing
- `/auth` -> Auth entry point
- `/login` -> redirect alias to `/auth`

Authenticated routes:
- `/dashboard` -> user dashboard
- `/event-planner` -> AI-guided planner
- `/manual-planner` -> manual service selection
- `/recommendations/:eventId` -> ranked recommendations
- `/book/:eventId` -> booking confirmation

Admin route:
- `/admin` -> operations console

## 6. UI Composition Strategy

### 6.1 Shared Shell
Top shell behavior from `App.jsx`:
- `TopBar` hidden on hero/auth pages.
- `BackButton` shown on inner non-dashboard/non-admin pages.
- role-aware nav links displayed conditionally.

### 6.2 Global AI Assistant
`AIChatWidget` is mounted once at root and internally checks token:
- eliminates repeated page-level mounting
- gives uninterrupted conversational context across route changes

## 7. Theming and Design Tokens

### 7.1 Tailwind Tokenization
Custom theme extension defines:
- semantic colors: `background`, `surface-*`, `primary`, `error`, etc.
- typography primitives: `hero-display`, `h1`, `h2`, `eyebrow`, `body-*`
- spacing primitives: `xs` to `xl`, plus layout tokens (`gutter`, `container-max`)
- animation keyframes: reveal and cinematic motion effects

### 7.2 Global CSS Layer
`index.css` adds:
- font imports
- base body and symbol settings
- unified form reset behavior
- custom scrollbars

## 8. Detailed API Integration by Page

All requests target `/api/*` and are proxied to backend in dev by Vite.

### 8.1 Auth Page (`AuthPage.jsx`)
Requests:
- `POST /api/auth/login`
- `POST /api/auth/register`

Input mapping:
- Login body: `{ email, password }`
- Register body: `{ email, password, full_name }`

Important behavior:
- attempts JSON parse and handles malformed/non-JSON backend response
- on success stores token only, then role-based navigation is handled by route guards

### 8.2 Event Planner Page (`EventPlanningPage.jsx`)
Requests:
- `POST /api/ai/event-plan`
- `POST /api/events`

Client-side validation:
- Step 1 requires event type, budget, guest count
- Step 2 requires city and vibe

Data transformation:
- `budget`, `guest_count` converted to numbers for AI planning
- event creation maps frontend fields to backend contract keys (`event_type`, `guest_count`, etc.)

### 8.3 Recommendations Page (`RecommendationsPage.jsx`)
Requests:
- `GET /api/recommendations?eventId=<id>`
- `GET /api/reviews/{venue|catering|vendor}/:id`

Functional behavior:
- adapts tabs and card counts to recommendation tier
- supports compare mode with estimated total preview
- carries selected objects to booking route through navigation state

### 8.4 Booking Page (`BookingPage.jsx`)
Requests:
- `GET /api/venues/:id/availability?date=<yyyy-mm-dd>`
- `POST /api/bookings`

Important behavior:
- blocks submit until availability check passes
- composes payload with chosen service IDs and event date

### 8.5 Dashboard Page (`DashboardPage.jsx`)
Requests:
- `GET /api/events`
- `GET /api/bookings/mine`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/reviews`

Feature behavior:
- active vs completed bookings split at UI level
- review modal for completed services

### 8.6 Manual Planner (`ManualPlannerPage.jsx`)
Requests:
- catalogs: `GET /api/venues`, `GET /api/catering`, `GET /api/vendors`
- submit flow: `POST /api/events`, then `POST /api/bookings`

Implementation note:
- total price is estimated client-side before submit and logged for validation visibility

### 8.7 Admin Dashboard (`AdminDashboard.jsx`)
Requests:
- `GET /api/admin/stats`
- tab-dependent `GET /api/admin/...`
- CRUD via `POST/PUT/DELETE /api/admin/{entity}`
- status operations via `PATCH`

Implementation note:
- one tab engine drives heterogeneous resources using dynamic endpoint selection

### 8.8 AI Chat Widget (`AIChatWidget.jsx`)
Request:
- `POST /api/ai/chat`

Context payload includes:
- user message
- recent history window
- current route path and timestamp

Persistence behavior:
- stores same-day transcript in localStorage key `kairos_chat_history`

## 9. Client-Side State Strategy
- Global state only for auth context.
- Feature state remains page-local with `useState` and `useEffect`.
- Network calls are colocated with pages for readability and straightforward debugging.

Tradeoff:
- less indirection and faster development
- but repeated fetch/auth header patterns are duplicated

## 10. Error Handling and Resilience
- Most protected requests handle `401` by logging out or redirecting.
- user-visible errors shown in form/planner contexts.
- fallback `console.error` logging for developer visibility.

Known limitation:
- no centralized error interceptor and no typed API client yet.

## 11. Performance Characteristics
- Vite dev server and route-based page composition keep iteration fast.
- No heavy global state container reduces rerender fan-out.
- Compare mode and recommendation cards render conditionally, limiting baseline load.

## 12. Suggested Improvement Roadmap
1. Introduce a shared API client module for auth headers and standardized error handling.
2. Add request/response runtime validation with Zod on the frontend.
3. Add route-level data prefetching for recommendations and dashboard analytics.
4. Add e2e tests for auth, planner, booking, and admin status updates.
