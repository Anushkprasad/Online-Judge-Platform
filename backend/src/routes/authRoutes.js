const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refresh,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/signup', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh', refresh);

module.exports = router;
