const router = require('express').Router();
const venueController = require('../controllers/venueController');

router.get('/', venueController.getAll);
router.get('/:id', venueController.getById);
router.get('/:id/availability', venueController.checkAvailability);
router.get('/:id/catering', venueController.getCateringDetails);

module.exports = router;
