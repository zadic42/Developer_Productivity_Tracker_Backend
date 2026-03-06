const express = require('express');
const router = express.Router();
const { startTimer, stopTimer, addManualTime, getWeeklySummary } = require('../controllers/timeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', startTimer);
router.post('/stop', stopTimer);
router.post('/manual', addManualTime);
router.get('/weekly', getWeeklySummary);

module.exports = router;
