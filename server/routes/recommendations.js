const router = require('express').Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', recommendationController.getRecommendations);

module.exports = router;
