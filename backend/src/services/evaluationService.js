const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const runCode = require('../utils/executor');
const { recordContestSolve } = require('../controllers/contestController');
const { notifyUser } = require('../utils/notificationService');

const TERMINAL_STATUSES = [
  'Accepted',
  'Wrong Answer',
  'Time Limit Exceeded',
  'Runtime Error',
  'Compilation Error',
];

const evaluateSubmission = async ({ submissionId, io } = {}) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  if (TERMINAL_STATUSES.includes(submission.status)) {
    return submission;
  }

  const problem = await Problem.findById(submission.problemId);
  if (!problem) {
    submission.status = 'Runtime Error';
    submission.error = 'Problem not found during evaluation';
    submission.judgedAt = new Date();
    await submission.save();
    return submission;
  }

  const testCases = problem.testCases || [];
  if (testCases.length === 0) {
    submission.status = 'Runtime Error';
    submission.error = 'No test cases defined for this problem';
    submission.judgedAt = new Date();
    await submission.save();
    return submission;
  }

  submission.status = 'Running';
  submission.error = '';
  await submission.save();
  emitSubmissionUpdate(io, submission);

  let finalStatus = 'Accepted';
  let finalError = '';
  let maxRuntime = 0;
  let maxMemory = 0;
  let failedTestCaseIndex = null;

  for (let i = 0; i < testCases.length; i += 1) {
    const testCase = testCases[i];
    const result = await runCode(submission.language, submission.code, testCase.input);

    maxRuntime = Math.max(maxRuntime, result.runtime || 0);
    maxMemory = Math.max(maxMemory, result.memory || 0);

    if (result.status !== 'Success' && result.status !== 'Accepted') {
      finalStatus = result.status;
      finalError = result.error || 'Execution failed';
      failedTestCaseIndex = i + 1;
      break;
    }

    const userOutput = result.output ? result.output.trim() : '';
    const expectedOutput = testCase.output ? testCase.output.trim() : '';

    if (userOutput !== expectedOutput) {
      finalStatus = 'Wrong Answer';
      finalError = `Output mismatch on testcase ${i + 1}`;
      failedTestCaseIndex = i + 1;
      break;
    }
  }

  submission.status = finalStatus;
  submission.runtime = maxRuntime;
  submission.memory = maxMemory;
  submission.error = finalError;
  submission.failedTestCaseIndex = failedTestCaseIndex;
  submission.judgedAt = new Date();
  await submission.save();

  if (finalStatus === 'Accepted') {
    await recordAcceptedSubmission({ submission, problem, io });
  }

  emitSubmissionUpdate(io, submission);
  return submission;
};

const recordAcceptedSubmission = async ({ submission, problem, io }) => {
  const user = await User.findById(submission.userId);
  if (!user) return;

  const alreadySolved = user.solvedProblems.some((id) => id.equals(problem._id));
  if (!alreadySolved) {
    user.solvedProblems.push(problem._id);
    user.streak += 1;
    await user.save();

    await notifyUser({
      user,
      type: 'achievement',
      title: 'Problem solved',
      message: `Nice work solving ${problem.title}. Your streak is now ${user.streak}.`,
      actionUrl: `/problems/${problem.slug}`,
    });
  }

  await recordContestSolve({
    userId: submission.userId,
    problemId: problem._id,
    contestId: submission.contestId,
    io,
  });
};

const emitSubmissionUpdate = (io, submission) => {
  if (!io) return;

  io.to(`user:${submission.userId}`).emit('submission:updated', {
    submissionId: submission._id,
    status: submission.status,
    runtime: submission.runtime,
    memory: submission.memory,
    error: submission.error,
    failedTestCaseIndex: submission.failedTestCaseIndex,
  });
};

module.exports = {
  evaluateSubmission,
  TERMINAL_STATUSES,
};
