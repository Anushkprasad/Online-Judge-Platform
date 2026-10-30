const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  sendDailyReminders,
  updatePreferences,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllNotificationsRead);
router.patch('/:id/read', protect, markNotificationRead);
router.get('/preferences/me', protect, getPreferences);
router.put('/preferences/me', protect, updatePreferences);
router.post('/daily-reminders', protect, authorize('admin'), sendDailyReminders);

module.exports = router;
