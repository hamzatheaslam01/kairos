const router = require('express').Router();
const vendorController = require('../controllers/vendorController');

router.get('/', vendorController.getAll);
router.get('/:id', vendorController.getById);

module.exports = router;
