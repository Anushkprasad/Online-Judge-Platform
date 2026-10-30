const User = require('../models/User');
const Submission = require('../models/Submission');
require('../models/Badge');
require('../models/Certificate');

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -refreshToken')
      .populate('badges.badgeId')
      .populate('certificates.certificateId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { bio, skills, githubUrl, linkedinUrl, profilePicture } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields if provided
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (githubUrl !== undefined) user.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('username streak solvedProblems badges certificates courseProgress')
      .populate('solvedProblems', 'title difficulty category')
      .populate('badges.badgeId')
      .populate('certificates.certificateId')
      .populate('courseProgress.courseId', 'title lessons');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Retrieve past submissions to draw the coding activity calendar heat map
    const submissions = await Submission.find({ userId: req.user._id })
      .select('submittedAt status')
      .sort({ submittedAt: 1 })
      .lean();

    // Calculate solved problem stats splits
    const easyCount = user.solvedProblems.filter((p) => p.difficulty === 'easy').length;
    const mediumCount = user.solvedProblems.filter((p) => p.difficulty === 'medium').length;
    const hardCount = user.solvedProblems.filter((p) => p.difficulty === 'hard').length;

    // Map course progress details
    const coursesStats = user.courseProgress.map((prog) => {
      if (!prog.courseId) return null;
      const total = prog.courseId.lessons?.length || 0;
      const completed = prog.completedLessonsIndices?.length || 0;
      return {
        courseId: prog.courseId._id,
        title: prog.courseId.title,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        completedCount: completed,
        totalCount: total,
      };
    }).filter(c => c !== null);

    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        streak: user.streak,
        badges: user.badges,
        certificates: user.certificates,
        solvedStats: {
          total: user.solvedProblems.length,
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
        },
        coursesProgress: coursesStats,
        submissionHistory: submissions.map(sub => ({
          date: sub.submittedAt.toISOString().split('T')[0],
          status: sub.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('username email solvedProblems streak rating')
      .lean();

    const rows = users
      .map((user) => {
        const solvedCount = user.solvedProblems?.length || 0;
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          solvedCount,
          totalScore: solvedCount * 100,
          streak: user.streak || 0,
          rating: user.rating || 1200,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore || b.streak - a.streak || a.username.localeCompare(b.username))
      .map((row, index) => ({ ...row, rank: index + 1 }));

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};
