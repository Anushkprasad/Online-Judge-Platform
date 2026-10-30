const Course = require('../models/Course');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const runCode = require('../utils/executor');
const { notifyAllUsers, notifyUser } = require('../utils/notificationService');

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().select('title description difficulty lessons.title').lean();

    // Annotate progress if authenticated
    let userProgress = [];
    if (req.user) {
      const user = await User.findById(req.user._id).select('courseProgress');
      userProgress = user.courseProgress;
    }

    const annotatedCourses = courses.map((course) => {
      const prog = userProgress.find((p) => p.courseId.toString() === course._id.toString());
      const totalLessons = course.lessons?.length || 0;
      const completedCount = prog ? prog.completedLessonsIndices.length : 0;
      const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        ...course,
        isEnrolled: !!prog,
        progressPercent: percent,
        completedLessonsCount: completedCount,
        totalLessons,
      };
    });

    res.status(200).json({ success: true, data: annotatedCourses });
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let progress = null;
    if (req.user) {
      const user = await User.findById(req.user._id).select('courseProgress');
      progress = user.courseProgress.find((p) => p.courseId.toString() === course._id.toString()) || null;
    }

    res.status(200).json({
      success: true,
      data: course,
      progress: progress
        ? {
            lastAccessedLessonIndex: progress.lastAccessedLessonIndex,
            completedLessonsIndices: progress.completedLessonsIndices,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const user = await User.findById(req.user._id);
    const alreadyEnrolled = user.courseProgress.some(
      (p) => p.courseId.toString() === course._id.toString()
    );

    if (!alreadyEnrolled) {
      user.courseProgress.push({
        courseId: course._id,
        lastAccessedLessonIndex: 0,
        completedLessonsIndices: [],
      });
      // Add user to course enrollment list
      if (!course.enrolledUsers.includes(user._id)) {
        course.enrolledUsers.push(user._id);
        await course.save();
      }
      await user.save();

      await notifyUser({
        user,
        type: 'course',
        title: 'Course enrollment confirmed',
        message: `You are enrolled in ${course.title}. Your progress starts now.`,
        actionUrl: `/courses/${course._id}`,
      });
    }

    res.status(200).json({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateLessonProgress = async (req, res, next) => {
  try {
    const { lessonIndex, isCompleted } = req.body;
    const courseId = req.params.id;

    const user = await User.findById(req.user._id);
    const progress = user.courseProgress.find((p) => p.courseId.toString() === courseId);

    if (!progress) {
      return res.status(400).json({ success: false, message: 'You are not enrolled in this course' });
    }

    // Update last accessed marker
    progress.lastAccessedLessonIndex = Number(lessonIndex);

    // Track completed array
    const idx = progress.completedLessonsIndices.indexOf(Number(lessonIndex));
    if (isCompleted && idx === -1) {
      progress.completedLessonsIndices.push(Number(lessonIndex));
    } else if (!isCompleted && idx > -1) {
      progress.completedLessonsIndices.splice(idx, 1);
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: 'Progress updated',
      progress: {
        lastAccessedLessonIndex: progress.lastAccessedLessonIndex,
        completedLessonsIndices: progress.completedLessonsIndices,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.submitQuiz = async (req, res, next) => {
  try {
    const { lessonIndex, answers } = req.body; // array of choice indices
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const lesson = course.lessons[lessonIndex];
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const quiz = lesson.quiz;
    if (!quiz || quiz.length === 0) {
      return res.status(400).json({ success: false, message: 'No quiz defined for this lesson' });
    }

    let correctCount = 0;
    const gradingDetails = quiz.map((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.correctAnswerIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        userAnswer,
        correctAnswer: q.correctAnswerIndex,
        isCorrect,
      };
    });

    const scorePercent = Math.round((correctCount / quiz.length) * 100);

    res.status(200).json({
      success: true,
      score: scorePercent,
      correctCount,
      totalCount: quiz.length,
      details: gradingDetails,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const { lessonIndex, language, code } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const lesson = course.lessons[lessonIndex];
    if (!lesson || !lesson.assignment) {
      return res.status(400).json({ success: false, message: 'No assignment defined for this lesson' });
    }

    const assignment = lesson.assignment;
    
    // Auto-grading: Run code and compare output
    const executionResult = await runCode(language, code, '');
    const userOutput = executionResult.output ? executionResult.output.trim() : '';
    const expectedOutput = assignment.expectedOutput ? assignment.expectedOutput.trim() : '';

    const passed = userOutput === expectedOutput;

    res.status(200).json({
      success: true,
      passed,
      output: executionResult.output,
      error: executionResult.error,
      expected: assignment.expectedOutput,
    });
  } catch (error) {
    next(error);
  }
};

exports.claimCertificate = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const user = await User.findById(req.user._id);
    const progress = user.courseProgress.find((p) => p.courseId.toString() === course._id.toString());

    if (!progress || progress.completedLessonsIndices.length < course.lessons.length) {
      return res.status(400).json({
        success: false,
        message: 'You must complete all course lessons before claiming a certificate.',
      });
    }

    // Check if certificate already exists
    let cert = await Certificate.findOne({ userId: user._id, referenceId: course._id });
    if (!cert) {
      cert = await Certificate.create({
        userId: user._id,
        type: 'course',
        referenceId: course._id,
      });

      // Add reference to User model certificates list
      user.certificates.push({
        certificateId: cert._id,
        earnedAt: new Date(),
      });
      await user.save();

      await notifyUser({
        user,
        type: 'achievement',
        title: 'Certificate earned',
        message: `You earned a certificate for ${course.title}.`,
        actionUrl: `/courses/${course._id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate claimed successfully',
      data: {
        certificateId: cert._id,
        issuedTo: user.username,
        courseTitle: course.title,
        issuedAt: cert.issuedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, difficulty, lessons } = req.body;
    const course = await Course.create({ title, description, difficulty, lessons });
    await notifyAllUsers({
      type: 'course',
      title: 'New course available',
      message: `${course.title} has been added to the course catalog.`,
      actionUrl: `/courses/${course._id}`,
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};
