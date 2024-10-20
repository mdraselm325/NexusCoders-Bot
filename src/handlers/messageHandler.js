const config = require('../config');
const { handleCommand } = require('./commandHandler');
const User = require('../models/user');
const logger = require('../utils/logger');

async function messageHandler(sock, msg) {
    try {
        if (!msg.message) return;
        
        const messageType = Object.keys(msg.message)[0];
        if (messageType === 'protocolMessage' || messageType === 'senderKeyDistributionMessage') return;

        const content = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       msg.message?.imageMessage?.caption ||
                       msg.message?.videoMessage?.caption;
                       
        if (!content) return;

        // Auto-read message if enabled
        if (config.features.autoRead) {
            await sock.readMessages([msg.key]);
        }

        // Check if message starts with prefix
        if (!content.startsWith(config.prefix)) return;

        // Parse command and arguments
        const [commandName, ...args] = content.slice(config.prefix.length).trim().split(' ');

        // Handle the command
        await handleCommand(sock, msg, args, commandName.toLowerCase());

    } catch (error) {
        logger.error('Error in message handler:', error);
    }
}

module.exports = messageHandler;
