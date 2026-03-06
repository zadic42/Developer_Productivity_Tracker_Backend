const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Todo', 'In Progress', 'Done'],
            default: 'Todo',
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },
        tags: [{
            type: String,
            trim: true,
        }],
        subtasks: [{
            title: {
                type: String,
                required: true,
            },
            completed: {
                type: Boolean,
                default: false,
            }
        }],
        recurring: {
            frequency: {
                type: String,
                enum: ['Daily', 'Weekly', 'Monthly', 'None'],
                default: 'None',
            },
            nextOccurrence: {
                type: Date,
            }
        },
        estimatedTime: {
            type: Number, // hours
            default: 0,
        },
        actualTime: {
            type: Number, // hours
            default: 0,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);
