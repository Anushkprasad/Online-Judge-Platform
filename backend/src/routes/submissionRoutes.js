const express = require('express');
const router = express.Router();
const { runCode, submitCode, getSubmissionStatus, getMySubmissions, getProblemSubmissions } = require('../controllers/submissionController');
const { protect } = require('../middlewares/auth');

router.post('/run', runCode);
router.post('/', protect, submitCode);
router.post('/submit', protect, submitCode);
router.get('/my', protect, getMySubmissions);
router.get('/:id/status', protect, getSubmissionStatus);
router.get('/user/:problemId', protect, getProblemSubmissions);

module.exports = router;
