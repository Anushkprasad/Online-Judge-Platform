const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/nodemailer');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction', {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeychangeinproduction', {
    expiresIn: '7d',
  });
};

exports.register = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const username = (req.body.username || req.body.name)?.trim();

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        verificationToken,
      });
    } catch (error) {
      if (error.code === 11000) {
        error.statusCode = 400;
        error.message = 'Username or email already exists';
      } else if (error.name === 'ValidationError') {
        error.statusCode = 400;
        error.message = Object.values(error.errors)
          .map((validationError) => validationError.message)
          .join(', ');
      } else {
        error.message = `Registration failed while creating user: ${error.message}`;
      }
      return next(error);
    }

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - CodeRank',
      html: `<h1>Welcome to CodeRank!</h1><p>Verify your email by clicking the link below:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification email simulated.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastActive = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email successfully verified.',
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html: `<h1>Password Reset</h1><p>Reset your password by clicking the link:</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.status(200).json({ success: true, message: 'Password reset link simulated.' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeychangeinproduction');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token session' });
  }
};
