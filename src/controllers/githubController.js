const axios = require('axios');
const User = require('../models/UserModel');

const GITHUB_BASE_URL = 'https://api.github.com';

const getGithubHeaders = () => {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
};

// @desc    Update GitHub username
// @route   PATCH /api/github/profile
// @access  Private
const updateGithubProfile = async (req, res) => {
    try {
        const { githubUsername } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { githubUsername },
            { new: true }
        );
        res.status(200).json({ message: "GitHub profile updated", githubUsername: user.githubUsername });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get GitHub metrics (commits, PRs, issues, languages)
// @route   GET /api/github/metrics
// @access  Private
const getGithubMetrics = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.githubUsername) {
            return res.status(200).json({
                username: "",
                totalRepos: 0,
                commits: 0,
                prs: 0,
                issues: 0,
                topLanguage: "N/A",
                topLanguages: {},
                metrics: { commitsThisMonth: 0 }
            });
        }

        const username = user.githubUsername;
        const headers = getGithubHeaders();

        // 1. Fetch Repos for Top Languages
        const reposRes = await axios.get(`${GITHUB_BASE_URL}/users/${username}/repos?sort=updated&per_page=100`, { headers });
        const repos = reposRes.data;

        const languages = {};
        let totalRepos = repos.length;
        repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });

        const topLanguage = Object.keys(languages).reduce((a, b) => languages[a] > languages[b] ? a : b, "N/A");

        // 2. Fetch Total PRs
        const prsRes = await axios.get(`${GITHUB_BASE_URL}/search/issues?q=author:${username}+type:pr`, { headers });
        const totalPRs = prsRes.data.total_count;

        // 3. Fetch Total Issues
        const issuesRes = await axios.get(`${GITHUB_BASE_URL}/search/issues?q=author:${username}+type:issue`, { headers });
        const totalIssues = issuesRes.data.total_count;

        // 4. Fetch Commits (Simplified approach for last 30 days)
        const commitsRes = await axios.get(`${GITHUB_BASE_URL}/search/commits?q=author:${username}`, { headers });
        const totalCommits = commitsRes.data.total_count;

        res.status(200).json({
            username,
            totalRepos,
            commits: totalCommits,
            prs: totalPRs,
            issues: totalIssues,
            topLanguage,
            topLanguages: languages, // This provides the distribution for the chart
            metrics: {
                commitsThisMonth: totalCommits,
            }
        });
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Error fetching GitHub data", error: error.message });
    }
};

// @desc    Get Commit Streak and Weekly Activity
// @route   GET /api/github/streak
// @access  Private
const getCommitStreak = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.githubUsername) {
            return res.status(200).json({ streak: 0, weeklyActivity: [] });
        }
        const username = user.githubUsername;
        const headers = getGithubHeaders();

        // Fetch events to calculate streak and weekly activity
        const eventsRes = await axios.get(`${GITHUB_BASE_URL}/users/${username}/events`, { headers });
        const pushEvents = eventsRes.data.filter(e => e.type === 'PushEvent');

        const commitDates = new Set();
        pushEvents.forEach(event => {
            const date = event.created_at.split('T')[0];
            commitDates.add(date);
        });

        // 1. Calculate Streak
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let current = new Date(today);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (commitDates.has(today) || commitDates.has(yesterdayStr)) {
            current = commitDates.has(today) ? new Date(today) : new Date(yesterdayStr);
            while (true) {
                const dateStr = current.toISOString().split('T')[0];
                if (commitDates.has(dateStr)) {
                    streak++;
                    current.setDate(current.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // 2. Prepare Weekly Trend (Last 7 days)
        const weeklyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = pushEvents.filter(e => e.created_at.startsWith(dateStr)).length;
            weeklyActivity.push({
                day: dateStr,
                commits: count
            });
        }

        res.status(200).json({ streak, weeklyActivity });
    } catch (error) {
        console.error("GitHub API Streak Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Error calculating streak", error: error.message });
    }
};

module.exports = {
    updateGithubProfile,
    getGithubMetrics,
    getCommitStreak
};
