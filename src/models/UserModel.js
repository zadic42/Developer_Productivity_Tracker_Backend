const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowecase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        githubUsername: {
            type: String,
            trim: true,
        },
        xp: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1,
        },
        badges: [
            {
                name: String,
                awardedAt: { type: Date, default: Date.now },
                icon: String
            }
        ]
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);