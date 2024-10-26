const logger = require('../utils/logger');
const config = require('../config');
const { executeCommand } = require('./commandHandler');

const messageHandler = {
    handleMessage: async (sock, message) => {
        try {
            if (!message.message) return;

            const messageText = message.message?.conversation || 
                              message.message?.extendedTextMessage?.text || 
                              message.message?.imageMessage?.caption ||
                              message.message?.videoMessage?.caption;

            if (!messageText?.startsWith(config.prefix)) return;

            const [command, ...args] = messageText.slice(config.prefix.length).trim().split(' ');
            await executeCommand(sock, message, command.toLowerCase(), args);
        } catch (error) {
            logger.error('Error in message handler:', error);
        }
    },

    handleGroupParticipantsUpdate: async (sock, update) => {
        const { id, participants, action } = update;

        if (!config.features.welcomeMessage) return;

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
    },

    handleGroupUpdate: async (sock, update) => {
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
};

module.exports = messageHandler;
