const express = require('express');
const router = express.Router();
const { createTeam, joinTeam, getTeamStats, getMyTeams } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createTeam);
router.get('/my', getMyTeams);
router.post('/join', joinTeam);
router.get('/:id/stats', getTeamStats);

module.exports = router;
