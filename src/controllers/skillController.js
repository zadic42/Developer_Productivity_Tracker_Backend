const Skill = require('../models/SkillModel');
const { addXP } = require('./gamificationController');

// @desc    Get all skills for a user
// @route   GET /api/skills
// @access  Private
const getSkills = async (req, res) => {
    try {
        const skills = await Skill.find({ userId: req.user.id }).sort({ level: -1 });
        res.status(200).json(skills);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Add or Update a skill manually
// @route   POST /api/skills
// @access  Private
const upsertSkill = async (req, res) => {
    try {
        const { name, level, hoursSpent, category } = req.body;

        if (!name) return res.status(400).json({ message: "Skill name is required" });

        const skill = await Skill.findOneAndUpdate(
            { userId: req.user.id, name },
            {
                $set: {
                    level: level || 1,
                    hoursSpent: hoursSpent || 0,
                    category: category || 'Other',
                    lastPracticed: new Date()
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json(skill);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get data for Radar Chart
// @route   GET /api/skills/radar
// @access  Private
const getRadarData = async (req, res) => {
    try {
        const skills = await Skill.find({ userId: req.user.id })
            .sort({ level: -1 })
            .limit(6); // Limit to top 6 for clean radar chart

        const labels = skills.map(s => s.name);
        const data = skills.map(s => s.level);

        res.status(200).json({ labels, data });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Internal Helper to increment skill hours
const incrementSkillGrowth = async (userId, skillName, hours) => {
    try {
        let skill = await Skill.findOne({ userId, name: skillName });

        const currentHours = skill ? skill.hoursSpent : 0;
        const currentLevel = skill ? skill.level : 1;
        const newHours = currentHours + hours;

        // Growth logic: Level up every 5 hours
        const newLevel = Math.min(100, 1 + Math.floor(newHours / 5));

        if (newLevel > currentLevel) {
            await addXP(userId, 'SKILL_LEVEL');
        }

        await Skill.findOneAndUpdate(
            { userId, name: skillName },
            {
                $set: {
                    hoursSpent: newHours,
                    level: newLevel,
                    lastPracticed: new Date()
                }
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Skill Growth Update Error:", error.message);
    }
};

module.exports = {
    getSkills,
    upsertSkill,
    getRadarData,
    incrementSkillGrowth
};
