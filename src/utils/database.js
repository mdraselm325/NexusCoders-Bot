const mongoose = require('mongoose');
const config = require('../config');
const logger = require('./logger');

async function connectToDatabase() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.database.uri, {
            ...config.database.options,
            dbName: 'nexusbot',
            retryWrites: true,
            w: 'majority'
        });
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        if (error.name === 'MongoParseError') {
            logger.error('Invalid MongoDB connection string');
            process.exit(1);
        }
        setTimeout(connectToDatabase, 5000);
    }
}

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(connectToDatabase, 5000);
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err);
    if (mongoose.connection.readyState !== 1) {
        setTimeout(connectToDatabase, 5000);
    }
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
