const Notification = require('../models/NotificationModel');
const Task = require('../models/TaskModel');
const Goal = require('../models/GoalModel');
const TimeEntry = require('../models/TimeEntryModel');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        // Trigger automated check first
        await generateAutomatedReminders(req.user.id);

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: "Notification not found" });

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Helper: Generate automated reminders
const generateAutomatedReminders = async (userId) => {
    try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Task Deadline Reminders (Deadline in next 24 hours)
        const approachingTasks = await Task.find({
            userId,
            status: { $ne: 'Done' },
            deadline: { $lte: tomorrow, $gte: today }
        });

        for (const task of approachingTasks) {
            const existing = await Notification.findOne({ userId, relatedId: task._id, type: 'Deadline' });
            if (!existing) {
                await Notification.create({
                    userId,
                    message: `Reminder: Task deadline tomorrow - ${task.title}`,
                    type: 'Deadline',
                    relatedId: task._id
                });
            }
        }

        // 2. Weekly Goal Reminders (Incomplete goals)
        const incompleteGoals = await Goal.find({
            userId,
            status: 'Active',
            deadline: { $gte: today }
        });

        for (const goal of incompleteGoals) {
            // Only notify if target is not reached and it's been a while since last notification
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const existing = await Notification.findOne({
                userId,
                relatedId: goal._id,
                type: 'Goal',
                createdAt: { $gte: oneDayAgo }
            });

            if (!existing && goal.progress < goal.target) {
                await Notification.create({
                    userId,
                    message: `Weekly goal incomplete: ${goal.title} (${goal.percentage}%)`,
                    type: 'Goal',
                    relatedId: goal._id
                });
            }
        }

        // 3. Daily Coding Reminder (If no time tracked today)
        const trackedToday = await TimeEntry.findOne({
            userId,
            startTime: { $gte: new Date().setHours(0, 0, 0, 0) }
        });

        if (!trackedToday) {
            const existingDaily = await Notification.findOne({
                userId,
                type: 'Reminder',
                createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
                message: /planned to code/
            });

            if (!existingDaily) {
                await Notification.create({
                    userId,
                    message: "Reminder: You planned to code today. Start your session now! 💻",
                    type: 'Reminder'
                });
            }
        }

    } catch (error) {
        console.error("Auto Notification Error:", error.message);
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
