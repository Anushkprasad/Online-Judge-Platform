const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { notifyAllUsers } = require('../utils/notificationService');

const isLiveContest = (contest, now = new Date()) => (
  contest.startTime <= now && contest.endTime >= now
);

const sortLeaderboard = (entries) => (
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    return new Date(a.finishTime) - new Date(b.finishTime);
  })
);

const calculateRatingChange = (rank, total) => {
  if (!total) return 0;
  const percentile = (total - rank + 1) / total;
  return Math.round((percentile - 0.5) * 80);
};

const serializeContest = (contest) => {
  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const status = now < startTime ? 'upcoming' : now > endTime ? 'ended' : 'live';

  return {
    ...contest.toObject(),
    status,
    durationMinutes: Math.max(0, Math.round((endTime - startTime) / 60000)),
  };
};

exports.getContests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const now = new Date();
    const query = {};

    if (type) query.type = type;
    if (status === 'upcoming') query.startTime = { $gt: now };
    if (status === 'live') {
      query.startTime = { $lte: now };
      query.endTime = { $gte: now };
    }
    if (status === 'ended') query.endTime = { $lt: now };

    const contests = await Contest.find(query)
      .populate('problems', 'title slug difficulty category')
      .sort({ startTime: status === 'ended' ? -1 : 1 });

    res.status(200).json({
      success: true,
      count: contests.length,
      data: contests.map(serializeContest),
    });
  } catch (error) {
    next(error);
  }
};

exports.getContestById = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('problems', 'title slug difficulty category')
      .populate('leaderboard.userId', 'username college rating');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const leaderboard = sortLeaderboard(contest.leaderboard.map((entry) => entry.toObject()))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.status(200).json({
      success: true,
      data: {
        ...serializeContest(contest),
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createContest = async (req, res, next) => {
  try {
    const { title, description, type, startTime, endTime, problems } = req.body;

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const problemCount = await Problem.countDocuments({ _id: { $in: problems || [] } });
    if (!problems?.length || problemCount !== problems.length) {
      return res.status(400).json({ success: false, message: 'Contest requires a valid problem set' });
    }

    const contest = await Contest.create({
      title,
      description,
      type,
      startTime,
      endTime,
      problems,
    });

    await notifyAllUsers({
      type: 'contest',
      title: `${contest.type === 'monthly' ? 'Monthly' : 'Weekly'} contest scheduled`,
      message: `${contest.title} starts on ${new Date(contest.startTime).toLocaleString()}.`,
      actionUrl: `/contests/${contest._id}`,
    });

    res.status(201).json({ success: true, data: contest });
  } catch (error) {
    next(error);
  }
};

exports.getContestLeaderboard = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('leaderboard.userId', 'username college rating');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const leaderboard = sortLeaderboard(contest.leaderboard.map((entry) => entry.toObject()))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { scope = 'global' } = req.query;
    const query = {};

    if (scope === 'college') {
      if (!req.user?.college) {
        return res.status(200).json({ success: true, data: [] });
      }
      query.college = req.user.college;
    }

    if (scope === 'friends') {
      const friendIds = req.user?.friends || [];
      query._id = { $in: [req.user._id, ...friendIds] };
    }

    const users = await User.find(query)
      .select('username college rating streak solvedProblems contestHistory')
      .sort({ rating: -1, streak: -1 })
      .limit(100)
      .populate('contestHistory.contestId', 'title type startTime endTime');

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      username: user.username,
      college: user.college,
      rating: user.rating,
      streak: user.streak,
      solvedCount: user.solvedProblems.length,
      contestHistory: user.contestHistory,
    }));

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

exports.recordContestSolve = async ({ userId, problemId, contestId, io }) => {
  const now = new Date();
  const query = contestId
    ? { _id: contestId, problems: problemId }
    : { startTime: { $lte: now }, endTime: { $gte: now }, problems: problemId };

  const contest = await Contest.findOne(query);
  if (!contest || !isLiveContest(contest, now)) return null;

  let entry = contest.leaderboard.find((item) => item.userId.equals(userId));
  const elapsedMinutes = Math.max(1, Math.ceil((now - contest.startTime) / 60000));

  if (!entry) {
    entry = contest.leaderboard.create({
      userId,
      score: 0,
      solvedProblems: [],
      penalty: 0,
      finishTime: now,
    });
    contest.leaderboard.push(entry);
  }

  const alreadySolved = entry.solvedProblems.some((id) => id.equals(problemId));
  if (!alreadySolved) {
    entry.solvedProblems.push(problemId);
    entry.score += 100;
    entry.penalty += elapsedMinutes;
    entry.finishTime = now;
    await contest.save();
  }

  const populatedContest = await Contest.findById(contest._id)
    .populate('leaderboard.userId', 'username college rating');
  const leaderboard = sortLeaderboard(populatedContest.leaderboard.map((item) => item.toObject()))
    .map((item, index) => ({ ...item, rank: index + 1 }));

  if (io) {
    io.to(`contest:${contest._id}`).emit('contest:leaderboard', {
      contestId: contest._id,
      leaderboard,
    });
  }

  return { contestId: contest._id, leaderboard };
};

exports.processContestRatings = async (contestId) => {
  const contest = await Contest.findById(contestId);
  if (!contest || contest.ratingProcessed || contest.endTime > new Date()) return null;

  const leaderboard = sortLeaderboard(contest.leaderboard);
  const total = leaderboard.length;

  for (let index = 0; index < leaderboard.length; index++) {
    const entry = leaderboard[index];
    const rank = index + 1;
    const ratingChange = calculateRatingChange(rank, total);
    const user = await User.findById(entry.userId);
    if (!user) continue;

    user.rating += ratingChange;
    user.contestHistory.push({
      contestId: contest._id,
      rank,
      score: entry.score,
      ratingChange,
      ratingAfter: user.rating,
    });
    entry.ratingChange = ratingChange;
    await user.save();
  }

  contest.ratingProcessed = true;
  await contest.save();
  return contest;
};
