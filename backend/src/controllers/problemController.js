const Problem = require('../models/Problem');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { notifyAllUsers } = require('../utils/notificationService');
const mongoose = require('mongoose');

exports.getProblems = async (req, res, next) => {
  try {
    const { difficulty, category, company, search } = req.query;

    const query = {};

    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (category) {
      query.category = category;
    }
    if (company) {
      query.companyTags = { $in: [company] };
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const problems = await Problem.find(query)
      .select('title slug difficulty category tags companyTags likes dislikes')
      .lean();

    // If authenticated, annotate whether the user solved or favorited it
    let user = null;
    if (req.user) {
      user = await User.findById(req.user._id).select('solvedProblems favorites');
    }

    const annotatedProblems = problems.map((problem) => {
      return {
        ...problem,
        isSolved: user ? user.solvedProblems.includes(problem._id) : false,
        isFavorite: user ? user.favorites.includes(problem._id) : false,
      };
    });

    res.status(200).json({ success: true, count: annotatedProblems.length, data: annotatedProblems });
  } catch (error) {
    next(error);
  }
};

exports.getProblemBySlug = async (req, res, next) => {
  try {
    const lookup = mongoose.Types.ObjectId.isValid(req.params.slug)
      ? { _id: req.params.slug }
      : { slug: req.params.slug };
    const problem = await Problem.findOne(lookup);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    let isEditorialUnlocked = false;
    let attemptsCount = 0;
    let isSolved = false;

    if (req.user) {
      const user = await User.findById(req.user._id).select('solvedProblems');
      isSolved = user.solvedProblems.includes(problem._id);

      // Count user submissions for this problem
      const submissions = await Submission.find({
        userId: req.user._id,
        problemId: problem._id,
      });

      attemptsCount = submissions.length;
      const hasAccepted = submissions.some((sub) => sub.status === 'Accepted');

      // Unlock editorial if solved or attempts >= 3
      if (isSolved || hasAccepted || attemptsCount >= 3) {
        isEditorialUnlocked = true;
      }
    }

    // Prepare response data, concealing the editorial if locked
    const problemData = problem.toObject();
    if (!isEditorialUnlocked) {
      problemData.editorial = 'LOCKED';
    }

    res.status(200).json({
      success: true,
      data: {
        ...problemData,
        isEditorialUnlocked,
        isSolved,
        attemptsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const user = await User.findById(req.user._id);
    const index = user.favorites.indexOf(problem._id);

    let isFavorite = false;
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(problem._id);
      isFavorite = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isFavorite ? 'Problem added to favorites' : 'Problem removed from favorites',
      isFavorite,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProblem = async (req, res, next) => {
  try {
    const { title, description, difficulty, category, tags, companyTags, constraints, testCases, starterTemplates, editorial, hints } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const problemExists = await Problem.findOne({ slug });
    if (problemExists) {
      return res.status(400).json({ success: false, message: 'A problem with a similar title already exists' });
    }

    const problem = await Problem.create({
      title,
      slug,
      description,
      difficulty,
      category,
      tags,
      companyTags,
      constraints,
      testCases,
      starterTemplates,
      editorial,
      hints,
    });

    await notifyAllUsers({
      type: 'problem',
      title: 'New problem added',
      message: `${problem.title} is now available in the ${problem.category} problem set.`,
      actionUrl: `/problems/${problem.slug}`,
    });

    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
};
