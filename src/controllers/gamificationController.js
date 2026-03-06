const User = require('../models/UserModel');

// XP Configuration
const XP_MAP = {
    TASK_COMPLETE: 50,
    CODING_HOUR: 100,
    STREAK_DAY: 20,
    SKILL_LEVEL: 200
};

// @desc    Add XP to user and handle level-up
const addXP = async (userId, action, multiplier = 1) => {
    try {
        const xpAmount = (XP_MAP[action] || 0) * multiplier;
        const user = await User.findById(userId);
        if (!user) return;

        user.xp += xpAmount;

        // Level Up Logic: Every 1000 XP = 1 Level (simple)
        const newLevel = Math.floor(user.xp / 1000) + 1;
        if (newLevel > user.level) {
            user.level = newLevel;
            // Potentially add a 'LevelUp' notification logic here
        }

        await user.save();
        return user;
    } catch (error) {
        console.error("XP Error:", error.message);
    }
};

// @desc    Check and award badges based on milestones
const checkAndAwardBadges = async (userId, stats) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const newBadges = [];

        // 1. Streak Badge
        if (stats.streak >= 7 && !user.badges.some(b => b.name === '7 Day Streak')) {
            newBadges.push({ name: '7 Day Streak', icon: '🔥' });
        }

        // 2. Commit Badge
        if (stats.totalCommits >= 100 && !user.badges.some(b => b.name === 'Century Committer')) {
            newBadges.push({ name: 'Century Committer', icon: '🚀' });
        }

        // 3. Hours Badge
        if (stats.totalHours >= 50 && !user.badges.some(b => b.name === 'Deep Diver')) {
            newBadges.push({ name: 'Deep Diver', icon: '📚' });
        }

        if (newBadges.length > 0) {
            user.badges.push(...newBadges);
            await user.save();
        }

        return user.badges;
    } catch (error) {
        console.error("Badge Error:", error.message);
    }
};

// @desc    Get Gamification Profile
// @route   GET /api/gamification/profile
// @access  Private
const getGamificationProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('xp level badges name');

        // Dynamic title based on level
        let title = "Beginner";
        if (user.level >= 10) title = "Senior Dev";
        else if (user.level >= 5) title = "Developer";
        else if (user.level >= 2) title = "Associate";

        res.status(200).json({
            ...user._doc,
            title,
            nextLevelXP: user.level * 1000,
            progressToNext: user.xp % 1000
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    addXP,
    checkAndAwardBadges,
    getGamificationProfile
};
