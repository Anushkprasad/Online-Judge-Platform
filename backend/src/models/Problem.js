const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: [true, 'Difficulty level is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    companyTags: [
      {
        type: String,
      },
    ],
    constraints: {
      type: String,
      default: '',
    },
    testCases: [
      {
        input: {
          type: String,
          required: true,
        },
        output: {
          type: String,
          required: true,
        },
        isSample: {
          type: Boolean,
          default: false,
        },
      },
    ],
    starterTemplates: [
      {
        language: {
          type: String,
          required: true,
        },
        code: {
          type: String,
          required: true,
        },
      },
    ],
    editorial: {
      type: String,
      default: '',
    },
    hints: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Problem', ProblemSchema);
