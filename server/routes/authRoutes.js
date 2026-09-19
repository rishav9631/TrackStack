const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

// Single-user password recovery — no OTP, emails temp password to rishavjha771@gmail.com
router.post('/forgot-password', authController.forgotPassword);

router.get('/me', authMiddleware, authController.getMe);
router.post('/categories', authMiddleware, authController.addCustomCategory);
router.put('/categories', authMiddleware, authController.renameCustomCategory);

module.exports = router;
