const TimeEntry = require('../models/TimeEntryModel');
const Task = require('../models/TaskModel');
const { incrementSkillGrowth } = require('./skillController');
const { addXP } = require('./gamificationController');

// @desc    Start a timer
// @route   POST /api/time/start
// @access  Private
const startTimer = async (req, res) => {
    try {
        const { taskId, project, type } = req.body;

        // Check for existing active timer
        const activeTimer = await TimeEntry.findOne({ userId: req.user.id, status: 'Active' });
        if (activeTimer) {
            return res.status(400).json({ message: "You already have an active timer running" });
        }

        const timeEntry = await TimeEntry.create({
            userId: req.user.id,
            taskId,
            project,
            type,
            startTime: new Date(),
            status: 'Active'
        });

        res.status(201).json(timeEntry);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Stop an active timer
// @route   POST /api/time/stop
// @access  Private
const stopTimer = async (req, res) => {
    try {
        const timeEntry = await TimeEntry.findOne({ userId: req.user.id, status: 'Active' });

        if (!timeEntry) {
            return res.status(404).json({ message: "No active timer found" });
        }

        const endTime = new Date();
        const duration = Math.round((endTime - timeEntry.startTime) / (1000 * 60)); // Duration in minutes

        timeEntry.endTime = endTime;
        timeEntry.duration = duration;
        timeEntry.status = 'Completed';
        await timeEntry.save();

        // Update task actualTime if taskId exists
        if (timeEntry.taskId) {
            const task = await Task.findById(timeEntry.taskId);
            if (task) {
                const hours = duration / 60;
                task.actualTime = (task.actualTime || 0) + hours;
                // Increment XP for coding hours
                await addXP(req.user.id, 'CODING_HOUR', hours);

                // Increment Skill Growth for each tag
                if (task.tags && task.tags.length > 0) {
                    for (const tag of task.tags) {
                        await incrementSkillGrowth(req.user.id, tag, hours);
                    }
                }
            }
        }

        res.status(200).json(timeEntry);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Add manual time entry
// @route   POST /api/time/manual
// @access  Private
const addManualTime = async (req, res) => {
    try {
        const { taskId, project, startTime, endTime, note } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: "Start and end times are required" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = Math.round((end - start) / (1000 * 60));

        if (duration < 0) {
            return res.status(400).json({ message: "End time cannot be before start time" });
        }

        const timeEntry = await TimeEntry.create({
            userId: req.user.id,
            taskId,
            project,
            type: 'Manual',
            startTime: start,
            endTime: end,
            duration,
            status: 'Completed',
            note
        });

        // Update task actualTime if taskId exists
        if (taskId) {
            const task = await Task.findById(taskId);
            if (task) {
                task.actualTime = (task.actualTime || 0) + (duration / 60);
                await task.save();
            }
        }

        res.status(201).json(timeEntry);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get Weekly Productivity Summary
// @route   GET /api/time/weekly
// @access  Private
const getWeeklySummary = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const summary = await TimeEntry.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    startTime: { $gte: sevenDaysAgo },
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
                    totalMinutes: { $sum: "$duration" },
                    tasks: { $addToSet: "$taskId" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    startTimer,
    stopTimer,
    addManualTime,
    getWeeklySummary
};
