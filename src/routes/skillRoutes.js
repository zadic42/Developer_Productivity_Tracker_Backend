const express = require('express');
const router = express.Router();
const { getSkills, upsertSkill, getRadarData } = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSkills)
    .post(upsertSkill);

router.get('/radar', getRadarData);

module.exports = router;
