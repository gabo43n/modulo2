const { Router } = require('express');
const groupController = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { groupValidators } = require('../validators');

const router = Router();

router.use(authenticate);

router.get('/', groupController.list);
router.get('/:id', groupValidators.id, validate, groupController.getById);
router.get('/:id/contacts', groupValidators.id, validate, groupController.getContacts);

router.post('/', groupValidators.create, validate, groupController.create);
router.put('/:id', groupValidators.update, validate, groupController.update);
router.delete('/:id', groupValidators.id, validate, groupController.remove);

module.exports = router;
