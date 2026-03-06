const express = require('express');
const router = express.Router();
const { createTeam, joinTeam, getTeamStats } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createTeam);
router.post('/join', joinTeam);
router.get('/:id/stats', getTeamStats);

module.exports = router;
