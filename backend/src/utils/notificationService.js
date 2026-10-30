const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./nodemailer');

const defaultPrefs = {
  inApp: {
    contest: true,
    course: true,
    problem: true,
    achievement: true,
    daily: true,
    general: true,
  },
  email: {
    contest: true,
    course: true,
    problem: true,
    achievement: true,
    daily: false,
    general: false,
  },
};

const getPreference = (user, channel, type) => {
  const channelPrefs = user.notificationPreferences?.[channel];
  const value = channelPrefs?.[type];
  if (value === undefined) return defaultPrefs[channel]?.[type] ?? true;
  return value;
};

const renderEmail = ({ title, message, actionUrl }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
    <h2>${title}</h2>
    <p>${message}</p>
    ${actionUrl ? `<p><a href="${actionUrl}">Open in CodeRank</a></p>` : ''}
  </div>
`;

const notifyUser = async ({ user, title, message, type = 'general', actionUrl = '' }) => {
  const userDoc = user.email ? user : await User.findById(user);
  if (!userDoc) return null;

  let notification = null;
  let emailSent = false;

  if (getPreference(userDoc, 'inApp', type)) {
    notification = await Notification.create({
      userId: userDoc._id,
      title,
      message,
      type,
      actionUrl,
    });
  }

  if (getPreference(userDoc, 'email', type)) {
    emailSent = await sendEmail({
      email: userDoc.email,
      subject: title,
      html: renderEmail({ title, message, actionUrl }),
    });

    if (notification) {
      notification.emailSent = emailSent;
      await notification.save();
    }
  }

  return notification;
};

const notifyUsers = async ({ users, title, message, type = 'general', actionUrl = '' }) => {
  const results = [];
  for (const user of users) {
    const notification = await notifyUser({ user, title, message, type, actionUrl });
    if (notification) results.push(notification);
  }
  return results;
};

const notifyAllUsers = async ({ title, message, type = 'general', actionUrl = '', filter = {} }) => {
  const users = await User.find(filter).select('email notificationPreferences');
  return notifyUsers({ users, title, message, type, actionUrl });
};

module.exports = {
  notifyAllUsers,
  notifyUser,
  notifyUsers,
};
