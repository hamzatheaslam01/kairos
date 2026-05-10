const router = require('express').Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Rate limiting for AI endpoints (only in production)
if (process.env.NODE_ENV === 'production') {
  const rateLimit = require('express-rate-limit');
  
  const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each user to 50 requests per windowMs
    message: 'Too many AI requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  router.use(aiRateLimiter);
}

// Existing endpoints
router.post('/chat', aiController.chat);
router.post('/event-plan', aiController.eventPlan);

// New endpoints (Phase 1)
router.post('/explain-recommendation', aiController.explainRecommendation);
router.post('/suggest-alternatives', aiController.suggestAlternatives);
router.post('/optimize-budget', aiController.optimizeBudget);

// Admin-only stats endpoint
router.get('/stats', aiController.getStats);

module.exports = router;
