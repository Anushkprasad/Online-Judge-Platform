const express = require('express');
const router = express.Router();
const {
  createAptitudeTest,
  createInterviewQuestion,
  getAptitudeTests,
  getInterviewQuestions,
  gradeAptitudeTest,
  startMockInterview,
  submitMockAnswer,
} = require('../controllers/interviewPrepController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/questions', protect, getInterviewQuestions);
router.post('/questions', protect, authorize('admin'), createInterviewQuestion);
router.get('/aptitude-tests', protect, getAptitudeTests);
router.post('/aptitude-tests', protect, authorize('admin'), createAptitudeTest);
router.post('/aptitude-tests/:id/grade', protect, gradeAptitudeTest);
router.post('/mock-sessions', protect, startMockInterview);
router.post('/mock-sessions/:id/answers', protect, submitMockAnswer);

module.exports = router;
