const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: String,
    warns: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    lastCommand: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
