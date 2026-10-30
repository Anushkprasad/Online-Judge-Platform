const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    linkedinUrl: {
      type: String,
      default: '',
    },
    skills: [
      {
        type: String,
      },
    ],
    streak: {
      type: Number,
      default: 0,
    },
    college: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      default: 1200,
    },
    contestHistory: [
      {
        contestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Contest',
        },
        rank: Number,
        score: {
          type: Number,
          default: 0,
        },
        ratingChange: {
          type: Number,
          default: 0,
        },
        ratingAfter: {
          type: Number,
          default: 1200,
        },
        participatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notificationPreferences: {
      inApp: {
        contest: {
          type: Boolean,
          default: true,
        },
        course: {
          type: Boolean,
          default: true,
        },
        problem: {
          type: Boolean,
          default: true,
        },
        achievement: {
          type: Boolean,
          default: true,
        },
        daily: {
          type: Boolean,
          default: true,
        },
        general: {
          type: Boolean,
          default: true,
        },
      },
      email: {
        contest: {
          type: Boolean,
          default: true,
        },
        course: {
          type: Boolean,
          default: true,
        },
        problem: {
          type: Boolean,
          default: true,
        },
        achievement: {
          type: Boolean,
          default: true,
        },
        daily: {
          type: Boolean,
          default: false,
        },
        general: {
          type: Boolean,
          default: false,
        },
      },
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    badges: [
      {
        badgeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Badge',
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    certificates: [
      {
        certificateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Certificate',
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    courseProgress: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        lastAccessedLessonIndex: {
          type: Number,
          default: 0,
        },
        completedLessonsIndices: [
          {
            type: Number,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
