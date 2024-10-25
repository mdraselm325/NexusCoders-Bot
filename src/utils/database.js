const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

async function connectToDatabase() {
    try {
        await mongoose.connect(config.database.uri, config.database.options);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(connectToDatabase, 5000);
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
});

module.exports = {
    connectToDatabase,
    mongoose
};
