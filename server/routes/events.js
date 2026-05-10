const router = require('express').Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', eventController.create);
router.get('/', eventController.getAll);
router.get('/:id', eventController.getById);

module.exports = router;
