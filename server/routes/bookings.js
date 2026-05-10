const router = require('express').Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', bookingController.create);
router.get('/mine', bookingController.getMyBookings);
router.get('/:id', bookingController.getById);
router.get('/user/:userId', bookingController.getByUser);
router.patch('/:id/cancel', bookingController.cancel);

module.exports = router;
