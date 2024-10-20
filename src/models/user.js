const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    warns: {
        type: Number,
        default: 0
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    lastCommandUsed: Date,
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.methods.addXP = async function(amount) {
    this.xp += amount;
    const nextLevel = Math.floor(0.1 * Math.sqrt(this.xp));
    if (nextLevel > this.level) {
        this.level = nextLevel;
    }
    await this.save();
    return this.level;
};

module.exports = mongoose.model('User', userSchema);
