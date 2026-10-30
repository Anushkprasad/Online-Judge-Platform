const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true, // Markdown content
  },
  videoUrl: {
    type: String,
    default: '',
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
  quiz: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
      correctAnswerIndex: {
        type: Number,
        required: true,
      },
    },
  ],
  codeExamples: [
    {
      title: String,
      code: String,
      language: String,
    },
  ],
  assignment: {
    question: String,
    instructions: String,
    templateCode: String,
    solutionCode: String,
    expectedOutput: String,
  },
});

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    lessons: [LessonSchema],
    enrolledUsers: [
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

module.exports = mongoose.model('Course', CourseSchema);
