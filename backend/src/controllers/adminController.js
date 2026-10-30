const User = require('../models/User');
const Problem = require('../models/Problem');
const Course = require('../models/Course');
const Contest = require('../models/Contest');
const Discussion = require('../models/Discussion');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const { sendNotificationEmail } = require('../utils/nodemailer');

// ============= USER MANAGEMENT =============

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select(
      '-password -refreshToken'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up related data
    await Submission.deleteMany({ userId });
    await Discussion.deleteMany({ authorId: userId });
    await Notification.deleteMany({ userId });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const submissionCount = await Submission.countDocuments({ userId });
    const discussionCount = await Discussion.countDocuments({ authorId: userId });

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        stats: { submissionCount, discussionCount },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============= PROBLEM MANAGEMENT =============

exports.createProblem = async (req, res, next) => {
  try {
    const { title, description, inputFormat, outputFormat, constraints, examples, difficulty, category, companyTags, testCases } = req.body;

    const problem = new Problem({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      inputFormat,
      outputFormat,
      constraints,
      examples,
      difficulty,
      category,
      companyTags: companyTags || [],
      testCases: testCases || [],
      createdBy: req.user._id,
    });

    await problem.save();

    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
};

exports.updateProblem = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const updateData = req.body;

    const problem = await Problem.findByIdAndUpdate(problemId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    res.status(200).json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
};

exports.deleteProblem = async (req, res, next) => {
  try {
    const { problemId } = req.params;

    const problem = await Problem.findByIdAndDelete(problemId);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Clean up related data
    await Submission.deleteMany({ problemId });

    res.status(200).json({ success: true, message: 'Problem deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getAllProblemsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, difficulty } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const problems = await Problem.find(query)
      .populate('createdBy', 'username email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Problem.countDocuments(query);

    res.status(200).json({
      success: true,
      data: problems,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============= COURSE MANAGEMENT =============

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, instructor, difficulty, category, topics, thumbnail, videoUrl } =
      req.body;

    const course = new Course({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      instructor: req.user._id,
      difficulty,
      category,
      topics: topics || [],
      thumbnail: thumbnail || '',
      videoUrl: videoUrl || '',
    });

    await course.save();

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    const course = await Course.findByIdAndUpdate(courseId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getAllCoursesAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'username email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============= CONTEST MANAGEMENT =============

exports.createContest = async (req, res, next) => {
  try {
    const { title, description, problems, startTime, endTime, difficulty } = req.body;

    const contest = new Contest({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      problems: problems || [],
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      difficulty: difficulty || 'medium',
      createdBy: req.user._id,
    });

    await contest.save();

    res.status(201).json({ success: true, data: contest });
  } catch (error) {
    next(error);
  }
};

exports.updateContest = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    const updateData = req.body;

    // Validate dates if provided
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    const contest = await Contest.findByIdAndUpdate(contestId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.status(200).json({ success: true, data: contest });
  } catch (error) {
    next(error);
  }
};

exports.deleteContest = async (req, res, next) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findByIdAndDelete(contestId);

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Clean up related submissions
    await Submission.deleteMany({ contestId });

    res.status(200).json({ success: true, message: 'Contest deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getAllContestsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const contests = await Contest.find(query)
      .populate('createdBy', 'username email')
      .populate('problems', 'title difficulty')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ startTime: -1 });

    const total = await Contest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contests,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============= DISCUSSION MODERATION =============

exports.getAllDiscussions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, flagged } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (flagged === 'true') {
      query.isFlagged = true;
    }

    const discussions = await Discussion.find(query)
      .populate('authorId', 'username email')
      .populate('problemId', 'title')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Discussion.countDocuments(query);

    res.status(200).json({
      success: true,
      data: discussions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.moderateDiscussion = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const { action } = req.body; // 'approve', 'reject', 'flag'

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (action === 'flag') {
      discussion.isFlagged = true;
    } else if (action === 'approve') {
      discussion.isFlagged = false;
    } else if (action === 'reject') {
      await Discussion.findByIdAndDelete(discussionId);
      return res.status(200).json({ success: true, message: 'Discussion deleted successfully' });
    }

    await discussion.save();

    res.status(200).json({ success: true, data: discussion, message: `Discussion ${action}ed successfully` });
  } catch (error) {
    next(error);
  }
};

exports.deleteDiscussion = async (req, res, next) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findByIdAndDelete(discussionId);

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    res.status(200).json({ success: true, message: 'Discussion deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============= ANALYTICS DASHBOARD =============

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProblems = await Problem.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalContests = await Contest.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const totalDiscussions = await Discussion.countDocuments();

    // Get submissions in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const submissionsLast7Days = await Submission.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get users registered in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get top 5 problems by submission count
    const topProblems = await Submission.aggregate([
      {
        $group: {
          _id: '$problemId',
          submissionCount: { $sum: 1 },
          acceptedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
          },
        },
      },
      { $sort: { submissionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'problems',
          localField: '_id',
          foreignField: '_id',
          as: 'problem',
        },
      },
      { $unwind: '$problem' },
      {
        $project: {
          title: '$problem.title',
          submissionCount: 1,
          acceptedCount: 1,
          acceptanceRate: {
            $multiply: [{ $divide: ['$acceptedCount', '$submissionCount'] }, 100],
          },
        },
      },
    ]);

    // Get difficulty distribution
    const difficultyDistribution = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalProblems,
          totalCourses,
          totalContests,
          totalSubmissions,
          totalDiscussions,
        },
        recentActivity: {
          submissionsLast7Days,
          newUsersLast30Days,
        },
        topProblems,
        difficultyDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============= NOTIFICATIONS =============

exports.sendNotificationToUsers = async (req, res, next) => {
  try {
    const { userIds, message, title, type = 'info' } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No users selected' });
    }

    if (!message || !title) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    // Create notifications for all selected users
    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      readAt: null,
    }));

    await Notification.insertMany(notifications);

    // Send emails to users
    const users = await User.find({ _id: { $in: userIds } }).select('email');
    for (const user of users) {
      await sendNotificationEmail(user.email, title, message);
    }

    res.status(200).json({
      success: true,
      message: `Notification sent to ${userIds.length} users`,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendBroadcastNotification = async (req, res, next) => {
  try {
    const { message, title, type = 'info' } = req.body;

    if (!message || !title) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    // Get all users
    const allUsers = await User.find().select('_id email');

    // Create notifications for all users
    const notifications = allUsers.map((user) => ({
      userId: user._id,
      title,
      message,
      type,
      readAt: null,
    }));

    await Notification.insertMany(notifications);

    // Send emails to all users
    for (const user of allUsers) {
      await sendNotificationEmail(user.email, title, message);
    }

    res.status(200).json({
      success: true,
      message: `Broadcast notification sent to ${allUsers.length} users`,
    });
  } catch (error) {
    next(error);
  }
};
