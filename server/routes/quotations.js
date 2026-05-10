const router = require('express').Router();
const quotationController = require('../controllers/quotationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', quotationController.create);
router.get('/my', quotationController.getMyQuotations);
router.get('/:id', quotationController.getById);

module.exports = router;
