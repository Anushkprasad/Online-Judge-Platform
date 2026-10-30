const express = require('express');
const router = express.Router();
const {
  getProblems,
  getProblemBySlug,
  toggleFavorite,
  createProblem,
} = require('../controllers/problemController');
const { protect, optionalProtect, authorize } = require('../middlewares/auth');

router.get('/', optionalProtect, getProblems);
router.get('/:slug', optionalProtect, getProblemBySlug);
router.post('/:id/favorite', protect, toggleFavorite);
router.post('/', protect, authorize('admin'), createProblem);

module.exports = router;
