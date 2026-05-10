const router = require('express').Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.get('/venue/:id', reviewController.getVenueReviews);
router.get('/vendor/:id', reviewController.getVendorReviews);
router.get('/catering/:id', reviewController.getCateringReviews);

router.use(auth);
router.post('/', reviewController.create);
router.get('/my', reviewController.getMyReviews);

module.exports = router;
