const { Router } = require('express');
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { contactValidators } = require('../validators');

const router = Router();

router.use(authenticate);

router.get('/', contactValidators.list, validate, contactController.list);
router.get('/favorites', contactValidators.list, validate, contactController.favorites);
router.get('/recent', contactController.recent);
router.get('/index', contactController.byLetter);
router.get('/sync', contactValidators.sync, validate, contactController.sync);
router.get('/:id', contactValidators.id, validate, contactController.getById);

router.post('/', contactValidators.create, validate, contactController.create);
router.put('/:id', contactValidators.update, validate, contactController.update);
router.patch('/:id/favorite', contactValidators.id, validate, contactController.toggleFavorite);
router.delete('/:id', contactValidators.id, validate, contactController.remove);

module.exports = router;
