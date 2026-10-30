const mongoose = require('mongoose');

const InterviewQuestionSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['technical', 'hr'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topics: [
      {
        type: String,
      },
    ],
    sampleAnswer: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const AptitudeTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
          },
        ],
        answerIndex: {
          type: Number,
          required: true,
        },
        explanation: {
          type: String,
          default: '',
        },
      },
    ],
  },
  { timestamps: true }
);

const MockInterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    mode: {
      type: String,
      enum: ['technical', 'hr', 'mixed'],
      default: 'mixed',
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
      },
    ],
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewQuestion',
        },
        answer: {
          type: String,
          default: '',
        },
        notes: {
          type: String,
          default: '',
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = {
  InterviewQuestion: mongoose.model('InterviewQuestion', InterviewQuestionSchema),
  AptitudeTest: mongoose.model('AptitudeTest', AptitudeTestSchema),
  MockInterviewSession: mongoose.model('MockInterviewSession', MockInterviewSessionSchema),
};
