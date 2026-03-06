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
            return res.status(400).json({ message: "GitHub username not set" });
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
        // Search API is better for cross-repo commit counts
        const commitsRes = await axios.get(`${GITHUB_BASE_URL}/search/commits?q=author:${username}`, { headers });
        const totalCommits = commitsRes.data.total_count;

        res.status(200).json({
            username,
            totalRepos,
            totalPRs,
            totalIssues,
            totalCommits,
            topLanguage,
            metrics: {
                commitsThisMonth: totalCommits, // Search API total is a good proxy for now
            }
        });
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Error fetching GitHub data", error: error.message });
    }
};

// @desc    Get Commit Streak
// @route   GET /api/github/streak
// @access  Private
const getCommitStreak = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const username = user.githubUsername;
        const headers = getGithubHeaders();

        // Fetch events to calculate streak (events API is good for recent activity)
        const eventsRes = await axios.get(`${GITHUB_BASE_URL}/users/${username}/events`, { headers });
        const pushEvents = eventsRes.data.filter(e => e.type === 'PushEvent');

        const commitDates = new Set();
        pushEvents.forEach(event => {
            const date = event.created_at.split('T')[0];
            commitDates.add(date);
        });

        const sortedDates = Array.from(commitDates).sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let today = new Date().toISOString().split('T')[0];
        let current = new Date(today);

        // Check if there's a commit today or yesterday to start the streak
        if (sortedDates.includes(today) || sortedDates.includes(new Date(current.setDate(current.getDate() - 1)).toISOString().split('T')[0])) {
            current = new Date(today);
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

        res.status(200).json({ streak });
    } catch (error) {
        res.status(500).json({ message: "Error calculating streak", error: error.message });
    }
};

module.exports = {
    updateGithubProfile,
    getGithubMetrics,
    getCommitStreak
};
