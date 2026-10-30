const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  enrollInCourse,
  updateLessonProgress,
  submitQuiz,
  submitAssignment,
  claimCertificate,
  createCourse,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/:id/enroll', protect, enrollInCourse);
router.put('/:id/progress', protect, updateLessonProgress);
router.post('/:id/quiz', protect, submitQuiz);
router.post('/:id/assignment', protect, submitAssignment);
router.post('/:id/certificate', protect, claimCertificate);
router.post('/', protect, authorize('admin'), createCourse);

module.exports = router;
