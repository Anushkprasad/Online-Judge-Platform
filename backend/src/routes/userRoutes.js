const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getDashboard } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

router.get('/profile/:username', getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/dashboard', protect, getDashboard);

module.exports = router;
