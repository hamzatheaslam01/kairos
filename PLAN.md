# KAIROS AI Feature Overhaul Plan

## Executive Summary

This document outlines a comprehensive plan to replace the current Ollama-based local AI implementation with Groq API, improve AI feature quality, and fix existing bugs and inconsistencies in the KAIROS event planning system.

---

## Current State Analysis

### Existing AI Implementation Issues

1. **Local Dependency Problem**
   - Currently uses Ollama (`http://localhost:11434`) requiring local installation
   - Model: `phi:latest` - small model with limited capabilities
   - Requires users to install and run Ollama locally
   - No fallback when Ollama is unavailable
   - Poor error handling when service is down

2. **AI Chat Widget Issues**
   - Widget is disabled (`return null;` on line 18 of AIChatWidget.jsx)
   - No proper error states or loading indicators
   - History management is basic (only last 6 messages)
   - No conversation persistence
   - No typing indicators or streaming responses

3. **Recommendation System Issues**
   - AI recommendations are unreliable (Ollama often fails)
   - Falls back to rule-based scoring without informing user properly
   - No explanation of why specific venues/caterers were recommended
   - AI reasoning is not displayed to users even when available
   - Inconsistent scoring between AI and rule-based methods

4. **Event Planning Feature Issues**
   - `/api/ai/event-plan` endpoint exists but is not used in frontend
   - No UI component to display generated event plans
   - JSON parsing errors not handled gracefully
   - No validation of AI-generated structured data

5. **General Code Quality Issues**
   - Hardcoded API URLs and model names
   - Inconsistent error messages
   - No retry logic for failed API calls
   - No rate limiting or request queuing
   - No caching of AI responses
   - Mixed concerns (AI logic in recommendation service)

---

## Proposed Solution: Groq API Integration

### Why Groq?

- **Fast inference**: 10-100x faster than traditional APIs
- **No local installation**: Cloud-based service
- **Better models**: Access to Llama 3, Mixtral, Gemma
- **Reliable**: Enterprise-grade uptime
- **Cost-effective**: Competitive pricing with generous free tier
- **Streaming support**: Real-time response streaming

### Recommended Models

1. **Primary**: `llama-3.1-70b-versatile`
   - Best for complex reasoning and recommendations
   - High quality responses
   - Good context window (128k tokens)

2. **Fast**: `llama-3.1-8b-instant`
   - For quick chat responses
   - Lower latency
   - Cost-effective for high-volume requests

3. **Fallback**: `mixtral-8x7b-32768`
   - Alternative if Llama models are unavailable
   - Good balance of speed and quality

---

## Implementation Plan

### Phase 1: Backend Infrastructure (Priority: HIGH)

#### 1.1 Groq Service Layer
**File**: `server/services/groqService.js` (NEW)

**Features**:
- Centralized Groq API client
- Request/response logging
- Error handling with retries
- Rate limiting
- Response caching (Redis optional)
- Model selection logic
- Streaming support
- Token usage tracking

**Implementation**:
```javascript
class GroqService {
  - initialize(apiKey, options)
  - chat(messages, options) // Standard chat completion
  - chatStream(messages, options) // Streaming responses
  - generateJSON(messages, schema) // Structured output
  - retryWithBackoff(fn, maxRetries)
  - selectModel(taskType) // Choose optimal model
  - validateResponse(response, schema)
  - logUsage(tokens, model, endpoint)
}
```

**Dependencies to add**:
- `groq-sdk` (official Groq SDK)
- `zod` (schema validation)
- `ioredis` (optional, for caching)

#### 1.2 Update Environment Configuration
**File**: `server/.env`

**Changes**:
```env
# Remove
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi:latest

# Add
GROQ_API_KEY=your_groq_api_key_here
GROQ_PRIMARY_MODEL=llama-3.1-70b-versatile
GROQ_FAST_MODEL=llama-3.1-8b-instant
GROQ_FALLBACK_MODEL=mixtral-8x7b-32768
GROQ_MAX_RETRIES=3
GROQ_TIMEOUT=30000
ENABLE_AI_CACHING=false
REDIS_URL=redis://localhost:6379 # Optional
```

#### 1.3 Refactor AI Controller
**File**: `server/controllers/aiController.js`

**Changes**:
- Remove `callOllama()` function
- Import and use `GroqService`
- Improve error handling
- Add request validation
- Add response streaming for chat
- Add conversation context management
- Add user-specific rate limiting

**New Features**:
- `/api/ai/chat` - Enhanced with streaming
- `/api/ai/event-plan` - Fix and improve
- `/api/ai/explain-recommendation` (NEW) - Explain why items were recommended
- `/api/ai/suggest-alternatives` (NEW) - Suggest alternatives if user doesn't like recommendations
- `/api/ai/optimize-budget` (NEW) - Suggest budget optimizations

#### 1.4 Refactor Recommendation Service
**File**: `server/services/recommendationService.js`

**Changes**:
- Remove `ollamaRecommend()` function
- Create separate `aiRecommendationService.js`
- Use GroqService for AI recommendations
- Improve prompt engineering
- Add detailed reasoning generation
- Add confidence scores
- Add alternative suggestions
- Better fallback handling

**New Logic**:
```javascript
// AI-powered recommendation flow
1. Fetch all eligible venues/caterers/decorators
2. Calculate rule-based scores (baseline)
3. Send to Groq with:
   - Event context
   - User preferences
   - Rule-based scores
   - Historical booking data
   - Reviews and ratings
4. Groq returns:
   - Ranked recommendations
   - Detailed reasoning for each
   - Confidence scores
   - Budget optimization tips
   - Alternative suggestions
5. Merge AI insights with rule-based data
6. Return enriched recommendations
```

---

### Phase 2: Frontend Improvements (Priority: HIGH)

#### 2.1 Fix and Enhance AI Chat Widget
**File**: `client/src/components/AIChatWidget.jsx`

**Critical Fixes**:
- Remove `return null;` (line 18) - enable the widget
- Add proper error boundaries
- Add connection status indicator
- Add retry mechanism

**Enhancements**:
- Implement streaming responses (SSE or WebSocket)
- Add typing indicators
- Add message timestamps
- Add conversation persistence (localStorage)
- Add "clear conversation" button
- Add "suggested questions" chips
- Add markdown rendering for AI responses
- Add copy-to-clipboard for messages
- Add feedback buttons (helpful/not helpful)
- Add conversation export
- Improve mobile responsiveness

**New Features**:
- Quick actions: "Show my bookings", "Find venues in [city]", "Budget calculator"
- Context awareness: Auto-include current event details if on event page
- Smart suggestions based on user's current page

#### 2.2 Enhance Recommendations Page
**File**: `client/src/pages/RecommendationsPage.jsx`

**Enhancements**:
- Display AI reasoning for each recommendation
- Show confidence scores
- Add "Why this recommendation?" expandable section
- Add "Show alternatives" button
- Add comparison view (side-by-side)
- Add filters (price range, rating, capacity)
- Add sorting options
- Show AI vs Rule-based badge more prominently
- Add loading skeleton instead of simple spinner
- Add error state with retry button

**New Components**:
- `RecommendationCard` - Enhanced card with reasoning
- `ReasoningPanel` - Expandable AI explanation
- `ComparisonView` - Side-by-side comparison
- `AlternativeSuggestions` - Show other options

#### 2.3 Create Event Planning Page (NEW)
**File**: `client/src/pages/EventPlanningPage.jsx` (NEW)

**Purpose**: Utilize the `/api/ai/event-plan` endpoint

**Features**:
- Multi-step form for event details
- Real-time AI-generated event plan
- Timeline visualization
- Budget breakdown chart
- Editable plan sections
- Export plan as PDF
- Share plan via link
- Save multiple plan versions

**Components**:
- `EventPlanForm` - Input form
- `TimelineView` - Visual timeline
- `BudgetBreakdown` - Pie/bar chart
- `PlanEditor` - Edit AI suggestions
- `PlanExport` - PDF generation

#### 2.4 Create AI Insights Dashboard (NEW)
**File**: `client/src/pages/AIInsightsPage.jsx` (NEW)

**Purpose**: Show AI-powered insights about user's events and bookings

**Features**:
- Spending patterns analysis
- Popular venue/caterer combinations
- Seasonal pricing trends
- Budget optimization suggestions
- Personalized recommendations based on history
- Comparison with similar events

---

### Phase 3: Advanced AI Features (Priority: MEDIUM)

#### 3.1 Smart Budget Optimizer
**Endpoint**: `/api/ai/optimize-budget` (NEW)

**Features**:
- Analyze current selections
- Suggest cost-saving alternatives
- Show where to splurge vs save
- Predict hidden costs
- Seasonal pricing insights

#### 3.2 Venue Comparison Assistant
**Endpoint**: `/api/ai/compare-venues` (NEW)

**Features**:
- Side-by-side comparison
- Pros/cons analysis
- Best fit recommendation
- Deal alerts
- Similar venue suggestions

#### 3.3 Event Checklist Generator
**Endpoint**: `/api/ai/generate-checklist` (NEW)

**Features**:
- AI-generated task list
- Timeline-based organization
- Priority levels
- Vendor coordination tasks
- Day-of timeline

#### 3.4 Review Summarizer
**Endpoint**: `/api/ai/summarize-reviews` (NEW)

**Features**:
- Aggregate review sentiment
- Extract common themes
- Highlight pros/cons
- Red flags detection
- Comparison across vendors

#### 3.5 Natural Language Search
**Endpoint**: `/api/ai/search` (NEW)

**Features**:
- "Find me a beach wedding venue under 200k"
- "Show caterers with vegetarian options in Lahore"
- Parse natural language queries
- Return relevant results
- Suggest refinements

---

### Phase 4: Bug Fixes & Improvements (Priority: HIGH)

#### 4.1 Backend Issues

**Authentication & Authorization**:
- [ ] Verify JWT token expiration handling
- [ ] Add refresh token mechanism
- [ ] Fix role-based access control edge cases
- [ ] Add rate limiting per user

**Database**:
- [ ] Add indexes for frequently queried fields
- [ ] Fix N+1 query problems in recommendations
- [ ] Add database connection pooling
- [ ] Add transaction support for bookings
- [ ] Validate data integrity constraints

**API Endpoints**:
- [ ] Standardize error response format
- [ ] Add request validation middleware (Joi/Zod)
- [ ] Add API versioning (/api/v1/)
- [ ] Add request logging
- [ ] Add response compression
- [ ] Fix CORS configuration for production

**Booking System**:
- [ ] Fix race condition in venue availability check
- [ ] Add pessimistic locking for bookings
- [ ] Validate date ranges properly
- [ ] Add booking confirmation emails (future)
- [ ] Add booking modification support
- [ ] Fix cancellation logic edge cases

**Recommendation Algorithm**:
- [ ] Fix capacity score calculation (currently binary)
- [ ] Add distance/location scoring
- [ ] Consider user preferences/history
- [ ] Add diversity in recommendations
- [ ] Fix price comparison for different pricing types

#### 4.2 Frontend Issues

**UI/UX**:
- [ ] Fix mobile responsiveness issues
- [ ] Add loading states consistently
- [ ] Add error boundaries
- [ ] Fix form validation feedback
- [ ] Add success/error toast notifications
- [ ] Improve accessibility (ARIA labels, keyboard nav)
- [ ] Add dark mode toggle (currently always dark)

**State Management**:
- [ ] Fix prop drilling issues
- [ ] Add proper context providers
- [ ] Add state persistence (localStorage)
- [ ] Fix unnecessary re-renders
- [ ] Add optimistic updates

**Routing**:
- [ ] Add protected route wrapper
- [ ] Add 404 page
- [ ] Add loading states for route transitions
- [ ] Fix back button behavior
- [ ] Add breadcrumbs

**Forms**:
- [ ] Add proper form validation
- [ ] Add field-level error messages
- [ ] Add auto-save for long forms
- [ ] Add form progress indicators
- [ ] Fix date picker issues

**Performance**:
- [ ] Add code splitting
- [ ] Add lazy loading for routes
- [ ] Optimize images
- [ ] Add service worker for caching
- [ ] Reduce bundle size

#### 4.3 Code Quality Issues

**Backend**:
- [ ] Add JSDoc comments
- [ ] Add input validation schemas
- [ ] Remove console.logs (use proper logger)
- [ ] Add unit tests for services
- [ ] Add integration tests for APIs
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Fix inconsistent naming conventions
- [ ] Remove dead code
- [ ] Add environment variable validation

**Frontend**:
- [ ] Add PropTypes or TypeScript
- [ ] Add component documentation
- [ ] Add Storybook for components
- [ ] Add unit tests (Jest/Vitest)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Fix ESLint warnings
- [ ] Standardize component structure
- [ ] Remove unused imports/variables

---

---

## Success Metrics

### Technical Metrics
- AI response time < 2 seconds (95th percentile)
- API uptime > 99.5%
- Zero critical bugs in production
- Test coverage > 80%
- Lighthouse score > 90

### User Experience Metrics
- AI recommendation acceptance rate > 60%
- Chat widget engagement > 30%
- User satisfaction score > 4.0/5.0
- Booking completion rate > 70%
- Return user rate > 40%

### Business Metrics
- Groq API costs < $100/month (initial)
- Average booking value increase > 10%
- User retention increase > 20%
- Support ticket reduction > 30%

---

## Risk Mitigation

### Technical Risks

**Risk**: Groq API downtime
**Mitigation**: 
- Implement robust fallback to rule-based recommendations
- Add request queuing and retry logic
- Cache common responses
- Monitor API status proactively

**Risk**: High API costs
**Mitigation**:
- Implement response caching
- Use faster models for simple queries
- Add rate limiting per user
- Monitor token usage closely
- Set budget alerts

**Risk**: Poor AI response quality
**Mitigation**:
- Extensive prompt engineering
- Response validation
- Fallback to rule-based when confidence is low
- Continuous monitoring and improvement
- A/B testing different prompts

**Risk**: Data privacy concerns
**Mitigation**:
- Don't send PII to Groq
- Anonymize user data in prompts
- Add data retention policies
- Comply with GDPR/privacy laws
- Add user consent mechanisms

### Business Risks

**Risk**: User resistance to AI features
**Mitigation**:
- Make AI features optional
- Provide clear explanations
- Show AI vs traditional side-by-side
- Gather user feedback
- Iterate based on usage data

**Risk**: Increased complexity
**Mitigation**:
- Maintain simple fallbacks
- Comprehensive documentation
- Gradual rollout
- Feature flags for easy disable
- Monitoring and alerting

---

## Dependencies & Prerequisites

### Required
- Groq API account and API key
- Node.js 18+ (current: check package.json)
- MongoDB (current: using Mongoose)
- Modern browser support (ES6+)

### Optional
- Redis (for caching)
- Sentry (for error tracking)
- Analytics platform (Mixpanel/Amplitude)
- CDN (for static assets)

### New NPM Packages

**Backend**:
```json
{
  "groq-sdk": "^0.3.0",
  "zod": "^3.22.0",
  "ioredis": "^5.3.0",
  "winston": "^3.11.0",
  "express-rate-limit": "^7.1.0",
  "joi": "^17.11.0"
}
```

**Frontend**:
```json
{
  "react-markdown": "^9.0.0",
  "recharts": "^2.10.0",
  "react-hot-toast": "^2.4.1",
  "date-fns": "^3.0.0",
  "zustand": "^4.4.0"
}
```

---

## Rollback Plan

### If Groq Integration Fails
1. Keep old Ollama code in separate branch
2. Feature flag to switch between Groq/Ollama/Rule-based
3. Database schema remains compatible
4. Frontend works with any backend mode

### Gradual Rollout Strategy
1. Deploy to staging environment first
2. Test with internal users (1 week)
3. Beta release to 10% of users
4. Monitor metrics closely
5. Gradual increase to 50%, then 100%
6. Keep rollback option for 2 weeks

---

