const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Contest title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['weekly', 'monthly'],
      default: 'weekly',
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    leaderboard: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        score: {
          type: Number,
          default: 0,
        },
        solvedProblems: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
          },
        ],
        penalty: {
          type: Number,
          default: 0,
        },
        finishTime: {
          type: Date,
          default: Date.now,
        },
        ratingChange: {
          type: Number,
          default: 0,
        },
      },
    ],
    ratingProcessed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contest', ContestSchema);
