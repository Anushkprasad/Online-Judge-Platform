const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const runCode = require('../utils/executor');
const { enqueueSubmission, getQueueStats } = require('../services/submissionQueue');

exports.runCode = async (req, res, next) => {
  try {
    const { problemId, language, code, customInput } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Determine what input to feed. Priority: customInput -> first sample test case -> empty string
    let input = customInput;
    if (input === undefined || input === null) {
      const sampleCase = problem.testCases.find((tc) => tc.isSample);
      input = sampleCase ? sampleCase.input : '';
    }

    const result = await runCode(language, code, input);

    res.status(200).json({
      success: true,
      status: result.status === 'Success' ? 'Accepted' : result.status,
      output: result.output,
      error: result.error,
      runtime: result.runtime,
      memory: result.memory,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitCode = async (req, res, next) => {
  try {
    const { problemId, language, code, contestId } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    if (!problem.testCases || problem.testCases.length === 0) {
      return res.status(400).json({ success: false, message: 'No test cases defined for this problem' });
    }

    const submission = await Submission.create({
      userId: req.user._id,
      problemId: problem._id,
      language,
      code,
      contestId: contestId || null,
      status: 'Queued',
    });

    const queuePosition = enqueueSubmission(submission._id);

    res.status(202).json({
      success: true,
      message: 'Submission queued for evaluation',
      submissionId: submission._id,
      status: submission.status,
      queuePosition,
      queue: getQueueStats(),
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionStatus = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...submission,
        verdict: submission.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ userId: req.user._id })
      .populate('problemId', 'title slug difficulty')
      .sort({ submittedAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions.map((submission) => ({
        ...submission,
        verdict: submission.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getProblemSubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({
      userId: req.user._id,
      problemId: req.params.problemId,
    }).sort({ submittedAt: -1 });

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    next(error);
  }
};
