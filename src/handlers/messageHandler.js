const config = require('../config');
const { executeCommand } = require('./commandHandler');
const User = require('../models/user');
const logger = require('../utils/logger');

async function messageHandler(sock, msg) {
    const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!content.startsWith(config.prefix)) return;

    const sender = msg.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');
    const command = content.slice(config.prefix.length).trim().split(' ')[0].toLowerCase();
    const args = content.slice(config.prefix.length).trim().split(' ').slice(1);

    if (config.disabledCommands.includes(command)) return;
    if (config.blockedUsers.includes(sender)) return;

    try {
        let user = await User.findOne({ jid: sender });
        if (!user) {
            user = await User.create({ jid: sender });
        }

        const messageInfo = {
            sock,
            msg,
            sender,
            isGroup,
            command,
            args,
            user
        };

        await executeCommand(messageInfo);
    } catch (error) {
        logger.error('Message handling error:', error);
        await sock.sendMessage(sender, { text: 'An error occurred while processing your command.' });
    }
}

module.exports = messageHandler;
