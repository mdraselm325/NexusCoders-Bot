const fs = require('fs-extra');
const path = require('path');

const logFile = path.join(process.cwd(), 'logs', 'bot.log');

const logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${message}`, ...args);
        writeToFile('INFO', message, args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${message}`, ...args);
        writeToFile('ERROR', message, args);
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${message}`, ...args);
        writeToFile('WARN', message, args);
    }
};

function writeToFile(level, message, args) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}] ${message} ${args.join(' ')}\n`;
    fs.appendFileSync(logFile, logMessage);
}

module.exports = logger;
