# KAIROS — Design Requirements Document
**Version:** 1.0  
**Product:** KAIROS Premium Event Planning Platform  
**Prepared for:** Stitch / AI Design System Generation  
**Date:** May 2026

---

## 1. Product Overview

**KAIROS** is a premium, dark-mode event planning platform for the Pakistani market. Users plan and book weddings, corporate events, birthdays, and parties. The platform is AI-assisted, matching clients with optimal venues, caterers, and decorators based on budget, guest count, location, and aesthetic vibe.

**Target User:** Affluent Pakistani event planners and clients who expect a high-end, luxury digital experience comparable to premium international brands like Net-a-Porter, LVMH, or Aman Hotels.

**Current Stack:** React + Vite, Tailwind CSS, Node.js + MongoDB backend.

---

## 2. Brand Identity

### 2.1 Brand Personality
- **Adjectives:** Luxurious, editorial, minimal, precise, authoritative, cinematic
- **Tone:** Confident, sophisticated, understated. Not flashy — "quiet luxury."
- **Reference Brands:** Bottega Veneta, Aesop, Aman Hotels, Net-a-Porter

### 2.2 Brand Name & Wordmark
- **Name:** KAIROS (Greek for "the perfect moment")
- **Wordmark style:** All-caps, wide letter-spacing (0.3em+), light weight (font-weight 200–300)
- **Never use** decorative flourishes or serifs on the wordmark itself

### 2.3 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#131313` | Page backgrounds |
| `surface` | `#131313` | Card backgrounds |
| `surface-container` | `#201f1f` | Elevated containers |
| `surface-container-high` | `#2a2a2a` | Modals, drawers |
| `primary` | `#E9C176` | Gold accent — CTAs, highlights, selected states |
| `primary-container` | `#C5A059` | Deeper gold for borders, secondary actions |
| `on-primary` | `#412D00` | Text on gold buttons |
| `on-surface` | `#E5E2E1` | Primary text |
| `on-surface-variant` | `#D1C5B4` | Secondary / body text |
| `surface-variant` | `#353534` | Borders, dividers |
| `outline` | `#9A8F80` | Subtle borders |
| `error` | `#FFB4AB` | Error states |
| `error-container` | `#93000A` | Error backgrounds |

**Primary accent is gold (#E9C176).** It should be used sparingly — only for the most important interactive element on any screen.

### 2.4 Typography

| Role | Font | Size | Weight | Letter-Spacing |
|---|---|---|---|---|
| Hero Heading | Manrope | 48–64px | 200 (ExtraLight) | 0.15em |
| Page Title (H1) | Manrope | 32px | 300 (Light) | 0.1em |
| Section Title (H2) | Manrope | 24px | 400 (Regular) | 0.05em |
| Label / Eyebrow | Manrope | 10–12px | 600 (SemiBold) | 0.2em |
| Body | Manrope | 16px | 400 (Regular) | 0em |
| Monospace data | System mono | 14px | 400 | 0em |

**Rule:** All headings and labels must be UPPERCASE. Body copy is sentence-case.

### 2.5 Shape & Spacing
- **Border radius:** Near-square. `2px` default, `4px` for panels, `8px` for modals. **No pill shapes.**
- **Spacing unit:** 8px base grid. All spacing values are multiples of 8.
- **Max content width:** 1440px centered
- **Dense but airy:** Generous whitespace between sections, tight spacing within components.

### 2.6 Iconography
- **Icon set:** Google Material Symbols (Outlined style)
- **Icon size:** 16–24px in context, 48–64px for hero/empty states
- **Icons are supporting elements only** — never the primary visual

---

## 3. User Flows & Screen-by-Screen Requirements

### Flow Overview
```
Landing (HeroPage)
  → Auth (Login / Register)
      → [Admin] Admin Dashboard
      → [User] Dashboard
            → AI Event Planner (EventPlanningPage) [Step 1 → 2 → 3 → Plan]
                  → Recommendations (RecommendationsPage)
                        → Booking Confirmation (BookingPage)
                              → Back to Dashboard
```

---

### Screen 1: Landing / Hero Page (`/`)

**Purpose:** First impression. Communicates the brand. Converts visitors to sign-ups.

**Current problems:**
- Cinematic video background is good, but the nav links ("Collection", "Atelier", "Archive", "Journal") are placeholders with no function — they create confusion
- CTA copy "Discover the Collection" is vague for an event planning app
- No value proposition below the headline

**Required design:**
- Full-screen cinematic video background (currently uses a cloudinary URL — keep this)
- Dark overlay gradient from bottom
- **Navbar:**
  - Left: KAIROS wordmark
  - Right: Single CTA button — "Begin Planning →" — links to `/auth`
  - Remove the decorative "Collection / Atelier / Archive / Journal" nav links entirely
- **Hero content (centered):**
  - Eyebrow label: `PREMIUM EVENT PLANNING — PAKISTAN`
  - H1: `A NEW ERA OF EVENT PLANNING`  
  - Subtitle: `KAIROS matches you with the finest venues, caterers, and decorators — intelligently, instantly.`
  - Primary CTA button: `Begin Planning →` (gold, links to `/auth`)
  - Below the CTA: 3 social-proof stats in a horizontal row
    - `50+ Premium Venues`
    - `200+ Curated Vendors`
    - `AI-Powered Matching`
- **Micro-animation:** Subtle entrance animation — elements fade up on load (staggered, 0.2s delay between each)
- **Scroll indicator:** Subtle animated arrow at the bottom center (optional if single-screen)

---

### Screen 2: Auth Page (`/auth`)

**Purpose:** Login and registration. Should feel secure and premium.

**Current problems:**
- The page is functional but sterile. No visual interest.
- Login/Register toggle is an invisible text link — users might not find it
- Demo credentials section at the bottom feels cheap / developer-facing — should be hidden or styled as a subtle hint

**Required design:**
- **Two-column layout (desktop):**
  - Left half: Full-height image or looping abstract video/gradient — branded visual  
  - Right half: Auth form, centered vertically
- **Right side content:**
  - KAIROS wordmark at top
  - H1: `Access the Atelier` (login) / `Join KAIROS` (register)
  - Subtitle: one line, understated
  - Form fields: Underline-only style (no box borders), with animated gold underline on focus
  - Primary CTA: Gold-bordered button with text "AUTHENTICATE" or "CREATE ACCOUNT"
  - **Toggle between login/register:** Not a tiny text link — a proper segmented control or tab selector at the top of the form. E.g., `[ LOGIN ] [ REGISTER ]` tabs with an animated sliding indicator
  - Error messages: Red banner at top of form, uppercase, small tracking
- **Demo credentials:** Collapsed behind a small `"View Demo Credentials"` disclosure button at the very bottom, in muted grey text
- **Mobile:** Single column, form takes full width with padding

---

### Screen 3: User Dashboard (`/dashboard`)

**Purpose:** The user's home. Shows past events, active bookings, and is the primary entry point for creating a new event.

**Current problems (CRITICAL UX ISSUES):**
- The "Create Experience" form and the bookings/events list are crammed side-by-side with no hierarchy
- The event creation form is duplicated — it exists both here AND in the EventPlanningPage. This creates confusion about where the user should go. **The Dashboard form should be removed.** The Dashboard should only show history + a single prominent CTA to the AI Planner.
- "Execute Match" as a button label is confusing — it just submits the form
- There is no greeting or personalization
- "Saved Configurations" is a confusing label for "Past Events"
- The "Abort" button for canceling a booking is alarming UX — use "Cancel Booking" instead

**Required design:**
- **Top area:** Welcome header
  - `WELCOME BACK` eyebrow label
  - H1: `Your KAIROS Dashboard`
  - One-line summary: "You have X active reservations"
- **Primary CTA card (full-width or large):**
  - A featured card inviting the user to plan a new event
  - Text: `PLAN A NEW EVENT`
  - Subtext: "Use our AI matching engine to find your perfect venue, caterer, and decorator"
  - Large gold "Start Planning" button → navigates to `/event-planner`
- **Active Reservations section:**
  - Section heading with count badge
  - Cards per booking showing:
    - Booking reference (monospace, muted)
    - Event type + city
    - Event date (human-readable: "May 12, 2026")
    - Total price (gold, monospace)
    - Status badge: confirmed (gold) / cancelled (red) / pending (grey)
    - "Cancel Booking" button (subtle, outlined in red, small) — NOT "Abort"
  - Empty state: An illustration-style message "No active reservations. Start planning your first event."
- **Past Events section:**
  - Section heading
  - Table or list of previous event configurations
  - Each row: Event type, city, guest count, budget, a "View Recommendations →" action
- **Layout:** Single column on mobile. Two-column grid on desktop (large CTA card + stats on left; reservations on right)

---

### Screen 4: AI Event Planner (`/event-planner`)

**Purpose:** A guided multi-step wizard to configure an event and generate an AI plan before proceeding to vendor selection.

**Current problems:**
- Step indicator circles are correct in concept but feel generic
- Step labels are missing — the user doesn't know what each numbered step means until they're in it
- "Basic Details" and "Location & Style" are uninspired step names
- The step 4 "Generated Plan" panel has no visual drama — the AI just generated something exciting and the UI doesn't reflect that
- The "Start Over" and "Proceed to Vendor Selection" buttons at step 4 look identical in style, making hierarchy unclear

**Required design:**

**Global layout:**
- Max width 900px, centered
- Top: KAIROS wordmark / breadcrumb link back to Dashboard

**Step Progress Bar:**
- Horizontal stepper with labels:
  - Step 1: `EVENT DETAILS`
  - Step 2: `LOCATION & VIBE`
  - Step 3: `CONFIRM`
  - Step 4: `YOUR PLAN`
- Active step has gold circle + gold label; completed steps have a checkmark icon; future steps are muted

**Step 1 — Event Details:**
- Event Type: Grid of large clickable cards (not small buttons). Each card has an icon + label. Selected card gets a gold border and subtle gold background tint.
  - Cards: Wedding 💍, Corporate 🏢, Birthday 🎂, Conference 🎙, Concert 🎵, Exhibition 🖼
- Budget (PKR): Full-width underline input with placeholder and a formatted preview below as user types (e.g., "PKR 5,00,000")
- Guest Count: Same style as budget input
- Clear error state if user tries to advance without filling required fields

**Step 2 — Location & Vibe:**
- City: Same large card grid as event types
  - Cards: Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan
- Event Vibe: Tag-style selector (pill-shaped chips — this is the ONE exception to the no-pill rule, because chips are a standard pattern)
  - Options: Elegant, Modern, Traditional, Casual, Luxurious, Minimalist
- Date picker: Styled date input with dark theme

**Step 3 — Review & Confirm:**
- Clean summary card showing all selections
- A brief AI disclaimer: "Our engine will analyze X venues and Y vendors to find the best match for your event."
- "Generate My Plan" CTA — large, gold, prominent, with sparkle icon ✨

**Step 4 — Generated AI Plan:**
- A dramatic reveal moment — animate the plan appearing
- **Plan header:** "YOUR EVENT STRATEGY" in large heading, with a tag showing the method (e.g., `AI-GENERATED` or `RULE-BASED`)
- **Budget Allocation section:** Horizontal bar chart (not just list items) — visual bars make it scannable at a glance. Each bar is gold. Category name on left, amount on right.
- **Timeline section:** Vertical stepper/timeline with numbered steps — keep current design but make it more polished
- **Recommendations section:** Bulleted list with gold bullet points
- **Action buttons (clear hierarchy):**
  - Secondary (outlined): "Start Over" — left-aligned, muted
  - Primary (gold, large): "Find My Vendors →" — right-aligned, prominent, navigates to recommendations

---

### Screen 5: Recommendations Page (`/recommendations/:eventId`)

**Purpose:** The user selects a venue, caterer, and decorator from AI-curated options.

**Current problems:**
- The page structure (three sections stacked vertically) makes it very long. The user must scroll past ALL venues before seeing caterers.
- The filter controls (Sort / Min Rating) are basic dropdown selects that don't match the premium brand
- The "Rank X" eyebrow on cards is useful but feels technical
- Card selection state (gold border + checkmark) is good — keep it
- The bottom action bar is a good pattern — keep it
- The "Compare" toggle is a great feature but feels like an afterthought

**Required design:**

**Layout change:**
- Switch from full vertical scroll to a **tabbed layout** (or accordion):
  - Tab 1: `01 / VENUES`
  - Tab 2: `02 / CATERING`
  - Tab 3: `03 / DECORATORS`
  - This reduces scroll and lets users focus on one category at a time
  - The bottom bar always shows all three selection states, no matter which tab is active
  - Tabs have a gold underline indicator for the active tab

**Filter bar:**
- Inline chip-style filters (not dropdowns): `Sort: Rank | Price | Rating` as toggleable pills
- Min Rating as a star-icon slider or chip: `All | 3★+ | 4★+ | 4.5★+`

**Vendor/Venue cards:**
- Keep the grid (3 columns desktop, 1 column mobile)
- Card anatomy:
  - Top: Rank badge (gold, small, top-left corner). Match % confidence (top-right, if available)
  - Name: Large, light weight
  - Location: Small muted text
  - Description: 2-line clamp (truncate with "..." if longer)
  - Capacity (for venues) or specialty tags (for vendors)
  - Bottom row: Price (gold monospace) | Rating (star icon + number)
  - CTA: Full-width "SELECT" button at bottom. When selected, becomes "✓ SELECTED" with gold fill.
- **Selected card:** Gold border (all 4 sides), very subtle gold background tint (#E9C176 at 5% opacity)

**Comparison mode:**
- When active, show side-by-side panel (keep current implementation, polish styles)

**Bottom action bar:**
- Always visible (fixed bottom)
- Shows 3 slots: Venue | Caterer | Decorator
- Unfilled slots show "— Select a venue —" in red/muted
- Filled slots show name in white
- "FINALIZE LOGISTICS" button unlocks only when all 3 are selected
- When locked: grey, `cursor-not-allowed`
- When unlocked: Gold, glows subtly with a `box-shadow: 0 0 20px rgba(233, 193, 118, 0.3)`

---

### Screen 6: Booking Confirmation Page (`/book/:eventId`)

**Purpose:** Final step. User selects a date, checks venue availability, and confirms the booking.

**Current problems:**
- The page is isolated — the user has no context of what they just selected (no summary of chosen venue, caterer, decorator)
- "Target Execution Date" is confusing — use "Event Date"
- "Abort" is a terrible button label — use "Go Back"
- The page feels empty — a lot of whitespace with just one input and two buttons

**Required design:**
- **Left column (or top section on mobile):** Summary of selections
  - Subheading: `YOUR SELECTION SUMMARY`
  - Venue: name, price
  - Caterer: name, price
  - Decorator: name, price
  - Divider
  - **Estimated Total:** Sum of all three, prominently displayed in gold monospace
- **Right column (or bottom section on mobile):** Booking form
  - Label: `EVENT DATE`
  - Date input (styled)
  - "Check Availability" button (small, outlined)
  - Availability result banner: green-tinted (available) or red-tinted (unavailable)
  - "CONFIRM BOOKING" CTA — gold, large, disabled until availability confirmed
  - "Go Back" link — small, muted, left-aligned
- **Success state:**
  - Replace the whole card content
  - Large gold checkmark icon (or animated tick)
  - H1: `BOOKING CONFIRMED`
  - Booking reference in large monospace: e.g., `KAI-20260512-001`
  - Subtext: "Redirecting to your dashboard..."
  - Confetti or subtle particle animation would be a bonus

---

### Screen 7: Admin Dashboard (`/admin`)

**Purpose:** Platform operator view. Shows stats and all bookings.

**Current problems:**
- Sidebar navigation items ("Audience", "Revenue") are `cursor-not-allowed` placeholders with no function — remove them or make them real
- The metrics grid is functional but visually bland
- "Infrastructure" metric showing `5 V / 12 VN` is cryptic

**Required design:**
- **Sidebar:**
  - Only show navigable items: `Insights` (active)
  - Add: `Bookings`, `Venues`, `Vendors` (even if they just scroll/filter the same data for now)
  - Style: Dark sidebar with gold active indicator on left edge
- **Metrics grid (4 cards):**
  - Total Bookings (with "+X this week" trend)
  - Confirmed Bookings (gold)
  - Active Users
  - Total Venues / Total Vendors (two separate cards or a split card)
  - Each card: metric value is large (48px), label is small caps, trend arrow in gold
- **Event Type distribution:** Small horizontal bar charts instead of pill tags (more readable at a glance)
- **Transaction Ledger table:**
  - Zebra-stripe rows (very subtle — alternating `#131313` / `#1A1A1A`)
  - Status badge: gold dot + "confirmed", red dot + "cancelled"
  - Monospace for all IDs and amounts
  - Column: "Date" should be added

---

### Component: AI Chat Widget

**Current:** A floating chat button that opens a slide-in panel.

**Required design:**
- Floating button: Gold circle, bottom-right corner, `sparkle` or `chat_bubble` icon
- Open state: Slide-in panel from the right (not bottom)
- Panel header: "KAIROS AI ASSISTANT" — KAIROS wordmark + subtitle "Ask me anything about your event"
- Message bubbles: User messages right-aligned (gold border-left), AI messages left-aligned (surface-container)
- Input at bottom: underline style with a send button (paper plane icon, gold)
- Should not overlap the bottom action bar on the Recommendations page

---

## 4. Global Component Design Rules

### 4.1 Glass Panels (`.glass-panel`)
- Background: `rgba(28, 27, 27, 0.7)` 
- Backdrop blur: `blur(20px)`
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- No drop shadow (the blur is the elevation indicator)

### 4.2 Buttons

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary (Filled) | `#E9C176` | `#412D00` | none | opacity 90% |
| Secondary (Outlined) | transparent | `#E9C176` | `1px solid #E9C176` | `bg: #E9C176 at 10%` |
| Ghost | transparent | `#E5E2E1 at 60%` | `1px solid #353534` | text at 100% |
| Destructive | transparent | `#FFB4AB` | `1px solid #FFB4AB` | `bg: #FFB4AB at 10%` |

- **All button text:** UPPERCASE, letter-spacing 0.2em, Manrope SemiBold
- **Padding:** 16px horizontal, 12–16px vertical
- **Border radius:** 2px (square)
- **Disabled state:** opacity 40%, cursor not-allowed

### 4.3 Form Inputs
- **Style:** Underline only (no box border). `border-bottom: 1px solid #353534`
- **Focus:** Bottom border transitions to gold `#E9C176`  
- **Label:** Small caps eyebrow ABOVE the input field, 10px, letter-spacing 0.2em, opacity 50%
- **Input text:** White, 16px
- **Placeholder:** White at 30% opacity
- **All inputs have a 300ms ease transition on the bottom border color**

### 4.4 Dividers
- `border: 1px solid rgba(46, 46, 46, 0.5)`
- Never use full-opacity dividers

### 4.5 Status Badges
- A small colored dot (6px, circle) + uppercase label
- `confirmed` → gold dot
- `pending` → grey dot
- `cancelled` → red dot

### 4.6 Loading States
- Spinner: Rotating `progress_activity` Material icon in gold
- Skeleton: Dark grey animated shimmer blocks in place of content
- Full-page loading: Centered spinner + gold pulsing dots with status text

### 4.7 Empty States
- Large (48px) Material icon, muted gold
- H3 message: brief, empathetic
- Optional: small CTA to take action

### 4.8 Error States
- Red-tinted banner (`#FFB4AB` text on `rgba(147, 0, 10, 0.1)` background)
- `1px solid rgba(255, 180, 171, 0.3)` border
- Small `error` icon on the left
- Uppercase tracking-widest text

---

## 5. Motion & Animation Principles

- **Default transition:** `300ms ease`
- **Page enter:** Content fades in + slides up 16px (`translateY(16px) → 0, opacity 0 → 1`)
- **Stagger:** When multiple items appear, stagger each by 50ms delay
- **Hover micro-animations:**
  - Buttons: slight scale `1.01` on hover
  - Cards: `border-color` transition, no scale (scale on cards feels cheap)
  - Nav links: opacity transition (60% → 100%)
- **Never use:** Bounce, elastic, or playful easing — this brand is serious and editorial
- **Animated elements:** Gold shimmer effect on primary CTAs (a slow horizontal shine passing across the button every few seconds)
- **Step transitions in wizard:** Slide — new step slides in from right, old step slides out to left

---

## 6. Responsive Design

| Breakpoint | Layout Notes |
|---|---|
| Mobile (< 768px) | Single column. Nav collapses to hamburger. Wizard steps are full-width. Cards are 1 per row. |
| Tablet (768–1024px) | Two columns where applicable. Sidebar hidden. |
| Desktop (> 1024px) | Full layouts as described. Max-width 1440px centered. |

---

## 7. Key UX Fixes to Prioritize

These are the most critical user experience issues to fix, ranked by severity:

1. **[CRITICAL] Duplicate event creation flows.** Dashboard has a form AND there's a separate `/event-planner` route. Remove the form from the Dashboard. Dashboard should only be a hub/overview.

2. **[CRITICAL] Missing context on Booking page.** User can't see what they selected. They need to see the venue, caterer, and decorator summary on the booking confirmation screen.

3. **[HIGH] Button label quality.** Replace all intimidating/technical labels:
   - "Abort" → "Cancel" or "Go Back"
   - "Execute Match" → "Find Vendors" or "Get Recommendations"
   - "Target Execution Date" → "Event Date"
   - "Infrastructure" → "Venue"

4. **[HIGH] Auth toggle discoverability.** The Login/Register switch is a tiny text link. Make it a segmented control.

5. **[HIGH] Recommendations page is too long.** Implement tabs for Venues / Catering / Decorators.

6. **[MEDIUM] Hero page nav links are dead.** Remove or replace with meaningful links.

7. **[MEDIUM] Admin sidebar placeholders.** Remove `cursor-not-allowed` items or implement them.

8. **[MEDIUM] No user greeting.** Add personalization to the Dashboard welcome header.

---

## 8. Screens to Design (Summary)

| # | Screen Name | Route | Priority |
|---|---|---|---|
| 1 | Landing / Hero | `/` | P1 |
| 2 | Login / Register | `/auth` | P1 |
| 3 | User Dashboard | `/dashboard` | P1 |
| 4 | AI Event Planner — Step 1 (Details) | `/event-planner` | P1 |
| 5 | AI Event Planner — Step 2 (Location) | `/event-planner` | P1 |
| 6 | AI Event Planner — Step 3 (Review) | `/event-planner` | P1 |
| 7 | AI Event Planner — Step 4 (AI Plan) | `/event-planner` | P1 |
| 8 | Recommendations — Venues Tab | `/recommendations/:id` | P1 |
| 9 | Recommendations — Caterers Tab | `/recommendations/:id` | P2 |
| 10 | Recommendations — Decorators Tab | `/recommendations/:id` | P2 |
| 11 | Booking Confirmation | `/book/:id` | P1 |
| 12 | Admin Dashboard | `/admin` | P2 |
| 13 | AI Chat Widget (open state) | Global overlay | P2 |

---

## 9. Design Deliverables Requested from Stitch

Please produce high-fidelity screen designs for all Priority 1 screens (screens 1–9, 11) in dark mode at desktop (1440px) and mobile (390px) breakpoints.

For each screen, provide:
- Full design at rest state
- Key interactive states (hover, focus, selected, loading, error, empty)
- Component annotations for spacing, color tokens, and typography

Please adhere strictly to:
- The KAIROS color palette defined in Section 2.3
- The typography scale defined in Section 2.4
- The component rules defined in Section 4
- The motion principles defined in Section 5

The design language should feel like it belongs on the same shelf as LVMH or Aman Hotels digital properties — dark, editorial, precise, and quietly luxurious.
