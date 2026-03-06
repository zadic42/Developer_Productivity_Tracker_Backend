const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        hoursSpent: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1, // 1 to 100 or 1 to 10
        },
        lastPracticed: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

// Ensure a user doesn't have duplicate skill names
skillSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Skill", skillSchema);
