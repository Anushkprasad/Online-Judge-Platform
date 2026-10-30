const express = require('express');
const router = express.Router();
const {
  createContest,
  getContestById,
  getContestLeaderboard,
  getContests,
  getLeaderboard,
  processContestRatings,
} = require('../controllers/contestController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, getContests);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/:id', protect, getContestById);
router.get('/:id/leaderboard', protect, getContestLeaderboard);
router.post('/', protect, authorize('admin'), createContest);
router.post('/:id/process-ratings', protect, authorize('admin'), async (req, res, next) => {
  try {
    const contest = await processContestRatings(req.params.id);
    if (!contest) {
      return res.status(400).json({ success: false, message: 'Contest is not ready for rating processing' });
    }
    res.status(200).json({ success: true, data: contest });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
