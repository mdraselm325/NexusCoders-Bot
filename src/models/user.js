const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    banned: {
        type: Boolean,
        default: false
    },
    banReason: String,
    commandsUsed: {
        type: Number,
        default: 0
    },
    warns: {
        type: Number,
        default: 0
    },
    lastInteraction: Date,
    joinedAt: {
        type: Date,
        default: Date.now
    },
    settings: {
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

async function getUser(userId) {
    let user = await User.findOne({ userId });
    if (!user) {
        user = await User.create({
            userId,
            lastInteraction: new Date()
        });
    }
    return user;
}

async function updateUser(userId, update) {
    const updatedUser = await User.findOneAndUpdate(
        { userId },
        { ...update, lastInteraction: new Date() },
        { new: true, upsert: true }
    );
    return updatedUser;
}

async function banUser(userId, reason) {
    const user = await updateUser(userId, {
        banned: true,
        banReason: reason
    });
    return user;
}

async function unbanUser(userId) {
    const user = await updateUser(userId, {
        banned: false,
        banReason: null
    });
    return user;
}

module.exports = {
    User,
    getUser,
    updateUser,
    banUser,
    unbanUser
};
