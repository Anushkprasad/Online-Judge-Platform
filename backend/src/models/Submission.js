const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      default: null,
    },
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending', 'Queued', 'Running'],
      default: 'Pending',
    },
    runtime: {
      type: Number, // in ms
      default: 0,
    },
    memory: {
      type: Number, // in KB
      default: 0,
    },
    error: {
      type: String,
      default: '',
    },
    failedTestCaseIndex: {
      type: Number,
      default: null,
    },
    judgedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Submission', SubmissionSchema);
