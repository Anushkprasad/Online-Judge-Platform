const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyAllUsers } = require('../utils/notificationService');

const allowedTypes = ['contest', 'course', 'problem', 'achievement', 'daily', 'general'];
const allowedChannels = ['inApp', 'email'];

exports.getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const query = { userId: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    res.status(200).json({ success: true, data: user.notificationPreferences });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const prefs = req.body.notificationPreferences || req.body;

    allowedChannels.forEach((channel) => {
      allowedTypes.forEach((type) => {
        if (typeof prefs?.[channel]?.[type] === 'boolean') {
          user.set(`notificationPreferences.${channel}.${type}`, prefs[channel][type]);
        }
      });
    });

    await user.save();
    res.status(200).json({ success: true, data: user.notificationPreferences });
  } catch (error) {
    next(error);
  }
};

exports.sendDailyReminders = async (req, res, next) => {
  try {
    const notifications = await notifyAllUsers({
      type: 'daily',
      title: 'Daily coding reminder',
      message: 'Keep your streak alive with one problem, lesson, or discussion today.',
      actionUrl: '/problems',
    });

    res.status(200).json({
      success: true,
      message: 'Daily reminders queued',
      count: notifications.length,
    });
  } catch (error) {
    next(error);
  }
};
