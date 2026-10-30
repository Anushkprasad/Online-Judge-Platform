const express = require('express');
const router = express.Router();
const {
  addComment,
  createDiscussion,
  getDiscussionById,
  getDiscussions,
  toggleCommentLike,
  toggleDiscussionLike,
} = require('../controllers/discussionController');
const { protect } = require('../middlewares/auth');

router.get('/', protect, getDiscussions);
router.post('/', protect, createDiscussion);
router.get('/:id', protect, getDiscussionById);
router.post('/:id/like', protect, toggleDiscussionLike);
router.post('/:id/comments', protect, addComment);
router.post('/:id/comments/:commentId/like', protect, toggleCommentLike);

module.exports = router;
