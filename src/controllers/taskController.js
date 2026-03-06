const Task = require('../models/TaskModel');
const { incrementSkillGrowth } = require('./skillController');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, tags, subtasks, recurring, estimatedTime } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            tags,
            subtasks,
            recurring,
            estimatedTime,
            userId: req.user.id
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update a task
// @route   PATCH /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const task = await Task.findOne({ _id: id, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Handle Status Transition for Recurring Tasks
        if (updates.status === 'Done' && task.recurring && task.recurring.frequency !== 'None') {
            const nextDate = new Date();
            if (task.recurring.frequency === 'Daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (task.recurring.frequency === 'Weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (task.recurring.frequency === 'Monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            updates.status = 'Todo';
            updates.recurring = { ...task.recurring.toObject(), nextOccurrence: nextDate };

            // Reset subtasks for next occurrence if they exist
            if (task.subtasks && task.subtasks.length > 0) {
                updates.subtasks = task.subtasks.map(s => ({ title: s.title, completed: false }));
            }
        }

        Object.assign(task, updates);
        await task.save();

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
