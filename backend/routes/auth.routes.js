const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, loginSchema, changePasswordSchema } = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/login', validate(loginSchema), authController.login);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/avatar', authenticate, upload.single('avatar'), authController.uploadAvatar);
router.get('/me', authenticate, authController.me);
router.get('/public-stats', authController.publicStats);

module.exports = router;
