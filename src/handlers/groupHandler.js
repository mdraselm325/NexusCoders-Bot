const logger = require('../utils/logger');
const config = require('../config');

async function handleGroupParticipantsUpdate(sock, update) {
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
    handleGroupParticipantsUpdate,
    handleGroupUpdate
};
