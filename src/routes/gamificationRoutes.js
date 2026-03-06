const express = require('express');
const router = express.Router();
const { getGamificationProfile } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getGamificationProfile);

module.exports = router;
