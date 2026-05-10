const router = require('express').Router();
const cateringController = require('../controllers/cateringController');

router.get('/', cateringController.getAll);
router.get('/:id', cateringController.getById);
router.get('/venue/:venueId', cateringController.getByVenue);

module.exports = router;
