const logger = require('../utils/logger');
const config = require('../config');
const { executeCommand } = require('./commandHandler');

async function handleMessage(sock, message) {
    try {
        if (!message.message) return;

        const messageType = Object.keys(message.message)[0];
        
        let messageText;
        if (messageType === 'conversation') {
            messageText = message.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            messageText = message.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            messageText = message.message.imageMessage.caption;
        } else if (messageType === 'videoMessage') {
            messageText = message.message.videoMessage.caption;
        }

        if (!messageText?.startsWith(config.bot.prefix)) return;

        const [command, ...args] = messageText.slice(config.bot.prefix.length).trim().split(' ');
        await executeCommand(sock, message, command.toLowerCase(), args);
    } catch (error) {
        logger.error('Error in message handler:', error);
    }
}

async function handleGroupParticipantsUpdate(sock, update) {
    const { id, participants, action } = update;

    try {
        const groupMetadata = await sock.groupMetadata(id);

        for (const participant of participants) {
            const user = participant.split('@')[0];
            let message = '';

            switch (action) {
                case 'add':
                    message = `Welcome @${user} to ${groupMetadata.subject}! 🎉`;
                    break;
                case 'remove':
                    message = `Goodbye @${user}! 👋`;
                    break;
                case 'promote':
                    message = `@${user} has been promoted to admin! 🎊`;
                    break;
                case 'demote':
                    message = `@${user} has been demoted! 📉`;
                    break;
            }

            if (message) {
                await sock.sendMessage(id, {
                    text: message,
                    mentions: [participant]
                });
            }
        }
    } catch (error) {
        logger.error('Error in group handler:', error);
    }
}

async function handleGroupUpdate(sock, update) {
    const { id, subject, desc } = update;

    try {
        if (subject) {
            await sock.sendMessage(id, {
                text: `Group name changed to: ${subject}`
            });
        }

        if (desc) {
            await sock.sendMessage(id, {
                text: `Group description updated!`
            });
        }
    } catch (error) {
        logger.error('Error in group update handler:', error);
    }
}

module.exports = {
    handleMessage,
    handleGroupParticipantsUpdate,
    handleGroupUpdate
};
