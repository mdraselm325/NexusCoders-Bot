const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

async function connectToDatabase() {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(config.database.uri, {
            ...config.database.options,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
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

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

module.exports = {
    connectToDatabase,
    mongoose
};
