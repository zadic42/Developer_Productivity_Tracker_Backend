const Goal = require('../models/GoalModel');

// @desc    Get all goals for a user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id }).sort({ deadline: 1 });
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res) => {
    try {
        const { title, description, target, unit, deadline } = req.body;

        if (!title || !target || !deadline) {
            return res.status(400).json({ message: "Please provide title, target, and deadline" });
        }

        const goal = await Goal.create({
            userId: req.user.id,
            title,
            description,
            target,
            unit,
            deadline
        });

        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update goal progress
// @route   PATCH /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
    try {
        const { progress, status, title, target, deadline } = req.body;
        const goal = await Goal.findById(req.params.id);

        if (!goal) return res.status(404).json({ message: "Goal not found" });

        // Ensure ownership
        if (goal.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Update fields
        if (progress !== undefined) goal.progress = progress;
        if (status) goal.status = status;
        if (title) goal.title = title;
        if (target) goal.target = target;
        if (deadline) goal.deadline = deadline;

        // Auto-complete if target reached
        if (goal.progress >= goal.target && goal.status === 'Active') {
            goal.status = 'Completed';
        }

        const updatedGoal = await goal.save();
        res.status(200).json(updatedGoal);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) return res.status(404).json({ message: "Goal not found" });

        if (goal.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await goal.deleteOne();
        res.status(200).json({ message: "Goal removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal
};
