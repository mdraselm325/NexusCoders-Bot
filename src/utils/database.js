const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://mateochatbot:xdtL2bYQ9eV3CeXM@gerald.r2hjy.mongodb.net/whatsappbot', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

module.exports = { connectToDatabase };
