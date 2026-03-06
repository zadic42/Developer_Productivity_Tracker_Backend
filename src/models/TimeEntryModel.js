const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number, // duration in minutes
            default: 0,
        },
        project: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['Focus', 'Normal', 'Manual', 'Coding', 'Research', 'Meeting', 'Learning'],
            default: 'Normal',
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Paused'],
            default: 'Active',
        },
        note: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("TimeEntry", timeEntrySchema);
