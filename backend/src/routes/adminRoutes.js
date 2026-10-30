const express = require('express');
const router = express.Router();
const {
  // User Management
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserDetails,
  // Problem Management
  createProblem,
  updateProblem,
  deleteProblem,
  getAllProblemsAdmin,
  // Course Management
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
  // Contest Management
  createContest,
  updateContest,
  deleteContest,
  getAllContestsAdmin,
  // Discussion Moderation
  getAllDiscussions,
  moderateDiscussion,
  deleteDiscussion,
  // Analytics
  getAnalytics,
  // Notifications
  sendNotificationToUsers,
  sendBroadcastNotification,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all admin routes
router.use(protect, authorize('admin'));

// ============= USER MANAGEMENT =============
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// ============= PROBLEM MANAGEMENT =============
router.get('/problems', getAllProblemsAdmin);
router.post('/problems', createProblem);
router.put('/problems/:problemId', updateProblem);
router.delete('/problems/:problemId', deleteProblem);

// ============= COURSE MANAGEMENT =============
router.get('/courses', getAllCoursesAdmin);
router.post('/courses', createCourse);
router.put('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);

// ============= CONTEST MANAGEMENT =============
router.get('/contests', getAllContestsAdmin);
router.post('/contests', createContest);
router.put('/contests/:contestId', updateContest);
router.delete('/contests/:contestId', deleteContest);

// ============= DISCUSSION MODERATION =============
router.get('/discussions', getAllDiscussions);
router.put('/discussions/:discussionId/moderate', moderateDiscussion);
router.delete('/discussions/:discussionId', deleteDiscussion);

// ============= ANALYTICS =============
router.get('/analytics', getAnalytics);

// ============= NOTIFICATIONS =============
router.post('/notifications/send', sendNotificationToUsers);
router.post('/notifications/broadcast', sendBroadcastNotification);

module.exports = router;
