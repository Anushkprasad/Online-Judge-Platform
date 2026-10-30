const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../utils/executor', () => jest.fn());

const submissionRoutes = require('../routes/submissionRoutes');
const runCode = require('../utils/executor');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/submissions', submissionRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

const waitForSubmissionStatus = async (submissionId, status, attempts = 100) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const submission = await Submission.findById(submissionId);
    if (submission?.status === status) return submission;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return Submission.findById(submissionId);
};

describe('Submission Routes', () => {
  let authToken;
  let problem;
  let user;

  beforeEach(async () => {
    runCode.mockResolvedValue({
      status: 'Success',
      output: '3\n',
      runtime: 12,
      memory: 0,
    });

    await Submission.deleteMany({});
    await Problem.deleteMany({});
    await User.deleteMany({});

    user = await User.create({
      username: 'submitter',
      email: 'submitter@example.com',
      password: 'password123',
    });
    authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'test-secret-key');

    problem = await Problem.create({
      title: 'Add Numbers',
      slug: 'add-numbers',
      description: 'Read two integers and print the sum.',
      difficulty: 'easy',
      category: 'Math',
      testCases: [
        {
          input: '1 2\n',
          output: '3\n',
          isSample: false,
        },
      ],
    });
  });

  it('should queue a submission and expose the final verdict by status endpoint', async () => {
    const queuedResponse = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        problemId: problem._id,
        language: 'python',
        code: 'print(3)',
      });

    expect(queuedResponse.status).toBe(202);
    expect(queuedResponse.body.success).toBe(true);
    expect(queuedResponse.body.status).toBe('Queued');
    expect(queuedResponse.body).toHaveProperty('submissionId');

    const judged = await waitForSubmissionStatus(queuedResponse.body.submissionId, 'Accepted');
    expect(judged.status).toBe('Accepted');
    expect(judged.runtime).toBe(12);
    expect(judged.judgedAt).toBeInstanceOf(Date);

    const statusResponse = await request(app)
      .get(`/api/submissions/${queuedResponse.body.submissionId}/status`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.status).toBe('Accepted');
    expect(statusResponse.body.data.verdict).toBe('Accepted');
  });

  it('should run sample code without requiring submission auth', async () => {
    const response = await request(app)
      .post('/api/submissions/run')
      .send({
        problemId: problem._id,
        language: 'python',
        code: 'print(3)',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Accepted');
    expect(response.body.output).toBe('3\n');
  });
});
