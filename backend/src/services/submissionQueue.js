const Submission = require('../models/Submission');
const { evaluateSubmission, TERMINAL_STATUSES } = require('./evaluationService');
const logger = require('../config/logger');

const queue = [];
let activeJobs = 0;
let io = null;

const concurrency = Math.max(Number(process.env.SUBMISSION_WORKER_CONCURRENCY || 1), 1);

const configureSubmissionQueue = ({ socketServer } = {}) => {
  io = socketServer || io;
};

const enqueueSubmission = (submissionId) => {
  queue.push({ submissionId: submissionId.toString(), enqueuedAt: new Date() });
  setImmediate(processQueue);
  return queue.length;
};

const getQueueStats = () => ({
  waiting: queue.length,
  active: activeJobs,
  concurrency,
});

const processQueue = () => {
  while (activeJobs < concurrency && queue.length > 0) {
    const job = queue.shift();
    activeJobs += 1;

    evaluateSubmission({ submissionId: job.submissionId, io })
      .catch((error) => {
        logger.error(`Submission worker failed for ${job.submissionId}: ${error.message}`);
        return markSubmissionFailed(job.submissionId, error);
      })
      .finally(() => {
        activeJobs -= 1;
        setImmediate(processQueue);
      });
  }
};

const markSubmissionFailed = async (submissionId, error) => {
  const submission = await Submission.findById(submissionId);
  if (!submission || TERMINAL_STATUSES.includes(submission.status)) return;

  submission.status = 'Runtime Error';
  submission.error = `Evaluator failed: ${error.message}`;
  submission.judgedAt = new Date();
  await submission.save();
};

module.exports = {
  configureSubmissionQueue,
  enqueueSubmission,
  getQueueStats,
};
