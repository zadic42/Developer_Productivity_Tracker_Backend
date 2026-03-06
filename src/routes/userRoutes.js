const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);

module.exports = router;
