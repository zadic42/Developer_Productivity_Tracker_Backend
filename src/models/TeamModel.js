const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        inviteCode: {
            type: String,
            unique: true,
            default: () => Math.random().toString(36).substring(2, 9).toUpperCase(),
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Team", teamSchema);
