const Task = require('../models/TaskModel');
const TimeEntry = require('../models/TimeEntryModel');
const User = require('../models/UserModel');
const axios = require('axios');
const { checkAndAwardBadges } = require('./gamificationController');

// Helper for GitHub headers (same as githubController)
const getGithubHeaders = () => {
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    return headers;
};

// @desc    Generate Weekly Productivity Report
// @route   GET /api/reports/weekly
// @access  Private
const getWeeklyReport = async (req, res) => {
    try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // 1. Fetch Completed Tasks (Done in last 7 days)
        // Note: TaskModel has updatedAt, we'll use that as completion proxy if status is 'Done'
        const completedTasks = await Task.countDocuments({
            userId: req.user.id,
            status: 'Done',
            updatedAt: { $gte: lastWeek }
        });

        // 2. Fetch Time Management Stats
        const timeEntries = await TimeEntry.find({
            userId: req.user.id,
            startTime: { $gte: lastWeek }
        });

        const totalMinutes = timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);
        const focusSessions = timeEntries.filter(e => e.type === 'Focus').length;
        const codingHours = (totalMinutes / 60).toFixed(1);

        // 3. Fetch GitHub Commits
        let githubCommits = 0;
        const user = await User.findById(req.user.id);

        if (user && user.githubUsername) {
            try {
                const headers = getGithubHeaders();
                // We use events API for most recent/accurate count
                const eventsRes = await axios.get(`https://api.github.com/users/${user.githubUsername}/events`, { headers });
                const pushEvents = eventsRes.data.filter(e =>
                    e.type === 'PushEvent' &&
                    new Date(e.created_at) >= lastWeek
                );

                pushEvents.forEach(event => {
                    githubCommits += event.payload.commits ? event.payload.commits.length : 0;
                });
            } catch (err) {
                console.error("Report GitHub Error:", err.message);
                // Fallback to 0 if API fails or rate limited
            }
        }

        // 4. Check and Award Badges
        await checkAndAwardBadges(req.user.id, {
            streak: githubCommits > 0 ? 7 : 0, // Simplified for now since we don't store streak in DB yet
            totalCommits: githubCommits,
            totalHours: parseFloat(codingHours)
        });

        res.status(200).json({
            title: "Weekly Productivity Report",
            period: "Last 7 Days",
            stats: {
                codingHours: parseFloat(codingHours),
                tasksCompleted: completedTasks,
                githubCommits: githubCommits,
                focusSessions: focusSessions
            },
            summary: `This week you spent ${codingHours} hours coding, completed ${completedTasks} tasks, and made ${githubCommits} commits. Great job!`
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getWeeklyReport
};
