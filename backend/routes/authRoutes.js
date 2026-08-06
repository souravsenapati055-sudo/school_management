const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/change-password', verifyToken, authController.changePassword);
router.get('/profile', verifyToken, authController.getProfile);

// Password Reset OTP Routes (Public)
router.post('/forgot-password/request-otp', authController.requestPasswordResetOTP);
router.post('/forgot-password/verify-otp', authController.verifyPasswordResetOTP);
router.post('/forgot-password/reset-password', authController.resetPasswordWithOTP);

module.exports = router;
