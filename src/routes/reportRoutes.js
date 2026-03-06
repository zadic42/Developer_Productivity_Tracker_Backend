const express = require('express');
const router = express.Router();
const { getWeeklyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/weekly', getWeeklyReport);

module.exports = router;
