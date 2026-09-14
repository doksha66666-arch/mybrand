const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, verifyEmail, resendVerificationCode, forgotPassword, resetPassword } = require('../controllers/authController');
const { start, callback } = require('../controllers/socialAuthController');
const { protect } = require('../middleware/auth');
const emailOnlyLogin = require('../middleware/emailOnlyLogin');
const { authLimiter, loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, register);
router.post('/login', loginLimiter, emailOnlyLogin, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', passwordResetLimiter, resendVerificationCode);

// Social OAuth: browser is redirected to the provider, then back here with a signed state.
router.get('/google', authLimiter, start('google'));
router.get('/google/callback', callback('google'));
router.get('/facebook', authLimiter, start('facebook'));
router.get('/facebook/callback', callback('facebook'));

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
