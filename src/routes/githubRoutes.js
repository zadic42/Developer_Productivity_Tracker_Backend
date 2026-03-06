const express = require('express');
const router = express.Router();
const { updateGithubProfile, getGithubMetrics, getCommitStreak } = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.patch('/profile', updateGithubProfile);
router.get('/metrics', getGithubMetrics);
router.get('/streak', getCommitStreak);

module.exports = router;
