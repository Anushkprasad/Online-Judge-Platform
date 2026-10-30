const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

const DiscussionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Discussion title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Discussion content is required'],
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: false, // Optional link to a specific problem
    },
    tags: [
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
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Discussion', DiscussionSchema);
