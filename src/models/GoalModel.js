const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        target: {
            type: Number,
            required: true, // e.g., 100 for "100 problems"
        },
        progress: {
            type: Number,
            default: 0,
        },
        unit: {
            type: String,
            default: 'items', // e.g., problems, days, projects
        },
        deadline: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Failed'],
            default: 'Active',
        }
    },
    {
        timestamps: true,
    }
);

// Virtual for progress percentage
goalSchema.virtual('percentage').get(function () {
    return Math.min(100, Math.round((this.progress / this.target) * 100));
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Goal", goalSchema);
