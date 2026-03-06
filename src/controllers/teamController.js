const Team = require('../models/TeamModel');
const Task = require('../models/TaskModel');
const TimeEntry = require('../models/TimeEntryModel');
const User = require('../models/UserModel');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: "Team name is required" });

        const team = await Team.create({
            name,
            description,
            owner: req.user.id,
            members: [req.user.id]
        });

        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Join a team via invite code
// @route   POST /api/teams/join
// @access  Private
const joinTeam = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const team = await Team.findOne({ inviteCode });

        if (!team) return res.status(404).json({ message: "Invalid invite code" });

        if (team.members.includes(req.user.id)) {
            return res.status(400).json({ message: "Already a member" });
        }

        team.members.push(req.user.id);
        await team.save();

        res.status(200).json({ message: "Joined team successfully", team });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get team productivity stats
// @route   GET /api/teams/:id/stats
// @access  Private
const getTeamStats = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Ensure user is member
        if (!team.members.includes(req.user.id)) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Aggregate data for all members
        const tasksDone = await Task.countDocuments({
            teamId: team._id,
            status: 'Done',
            updatedAt: { $gte: lastWeek }
        });

        const timeEntries = await TimeEntry.find({
            userId: { $in: team.members },
            startTime: { $gte: lastWeek }
        });

        const totalMinutes = timeEntries.reduce((acc, entry) => acc + (entry.duration || 0), 0);

        // Member breakdown
        const memberStats = await Promise.all(team.members.map(async (mId) => {
            const user = await User.findById(mId).select('name');
            const mEntries = timeEntries.filter(e => e.userId.toString() === mId.toString());
            const mMinutes = mEntries.reduce((acc, e) => acc + (e.duration || 0), acc = 0);
            return {
                name: user?.name || 'Unknown',
                hours: (mMinutes / 60).toFixed(1)
            };
        }));

        res.status(200).json({
            teamName: team.name,
            totalHours: (totalMinutes / 60).toFixed(1),
            tasksDone,
            memberBreakdown: memberStats
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createTeam,
    joinTeam,
    getTeamStats
};
