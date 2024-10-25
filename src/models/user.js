const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    warns: {
        type: Number,
        default: 0
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    lastDaily: {
        type: Date
    },
    balance: {
        type: Number,
        default: 0
    },
    inventory: [{
        item: String,
        quantity: Number
    }],
    achievements: [{
        name: String,
        unlockedAt: Date
    }],
    settings: {
        notifications: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: 'en'
        },
        prefix: {
            type: String
        }
    },
    statistics: {
        commandsUsed: {
            type: Number,
            default: 0
        },
        messagesReceived: {
            type: Number,
            default: 0
        },
        messagesSent: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

userSchema.methods.addExperience = async function(amount) {
    this.experience += amount;
    const levelUp = this.checkLevelUp();
    await this.save();
    return levelUp;
};

userSchema.methods.checkLevelUp = function() {
    const nextLevel = Math.floor(0.1 * Math.sqrt(this.experience));
    if (nextLevel > this.level) {
        this.level = nextLevel;
        return true;
    }
    return false;
};

userSchema.methods.warn = async function() {
    this.warns += 1;
    await this.save();
    return this.warns >= config.maxWarns;
};

userSchema.methods.clearWarns = async function() {
    this.warns = 0;
    await this.save();
};

userSchema.methods.ban = async function() {
    this.isBanned = true;
    await this.save();
};

userSchema.methods.unban = async function() {
    this.isBanned = false;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
