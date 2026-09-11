const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { authValidators } = require('../validators');

const router = Router();

router.post('/register', authValidators.register, validate, authController.register);
router.post('/login', authValidators.login, validate, authController.login);

router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, authValidators.updateProfile, validate, authController.updateProfile);
router.put('/me/password', authenticate, authValidators.changePassword, validate, authController.changePassword);
router.get('/me/stats', authenticate, authController.getStats);

module.exports = router;
