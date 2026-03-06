const Task = require('../models/TaskModel');
const TimeEntry = require('../models/TimeEntryModel');
const Skill = require('../models/SkillModel');
const User = require('../models/UserModel');

// @desc    Get dashboard analytics data for charts
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            last7Days.push(d);
        }

        // 1. Coding Hours Trend (Last 7 Days)
        const timeTrend = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const entries = await TimeEntry.find({
                userId,
                startTime: { $gte: date, $lt: nextDay }
            });

            const totalMinutes = entries.reduce((acc, e) => acc + (e.duration || 0), 0);
            return {
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: parseFloat((totalMinutes / 60).toFixed(1))
            };
        }));

        // 2. Task Completion Rate
        const totalTasks = await Task.countDocuments({ userId });
        const completedTasks = await Task.countDocuments({ userId, status: 'Done' });

        // 3. Skill Distribution (for Radar/Pi Chart)
        const skills = await Skill.find({ userId });
        const skillDistribution = skills.map(s => ({
            subject: s.name,
            A: s.level,
            fullMark: 100
        }));

        // 4. Productivity Ratios
        const weeklyTasks = await Task.countDocuments({
            userId,
            status: 'Done',
            updatedAt: { $gte: last7Days[0] }
        });

        res.status(200).json({
            timeTrend,
            taskStats: {
                total: totalTasks,
                completed: completedTasks,
                weeklyCompletion: weeklyTasks,
                rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            },
            skillDistribution,
            summary: {
                totalHours: timeTrend.reduce((acc, day) => acc + day.hours, 0).toFixed(1),
                avgDailyHours: (timeTrend.reduce((acc, day) => acc + day.hours, 0) / 7).toFixed(1)
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getDashboardData
};
