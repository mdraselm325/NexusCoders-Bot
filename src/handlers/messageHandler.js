const logger = require('../utils/logger');
const config = require('../config');
const { executeCommand } = require('./commandHandler');

const messageCount = new Map();
const typingStates = new Map();

function handleSpam(jid) {
    if (!config.features?.antiSpam?.enabled) return false;
    
    const now = Date.now();
    const userData = messageCount.get(jid) || { count: 0, lastReset: now };
    
    if (now - userData.lastReset > (config.features?.antiSpam?.interval || 30000)) {
        userData.count = 0;
        userData.lastReset = now;
    }
    
    userData.count++;
    messageCount.set(jid, userData);
    
    return userData.count > (config.features?.antiSpam?.maxMessages || 10);
}

async function simulateTyping(sock, jid) {
    if (!config.features?.presence?.autoTyping) return;
    
    if (typingStates.get(jid)) return;
    typingStates.set(jid, true);
    
    try {
        await sock.presenceSubscribe(jid);
        await sock.sendPresenceUpdate('composing', jid);
        setTimeout(async () => {
            await sock.sendPresenceUpdate('paused', jid);
            typingStates.delete(jid);
        }, 1000);
    } catch (error) {
        typingStates.delete(jid);
    }
}

async function handleMessage(sock, message) {
    try {
        if (!message?.message) return;

        const jid = message.key.remoteJid;
        if (!jid) return;

        const sender = message.key.participant || message.key.remoteJid;
        
        if (handleSpam(sender)) {
            await sock.sendMessage(jid, {
                text: '⚠️ Please slow down! You are sending messages too quickly.'
            });
            return;
        }

        let messageText = '';
        const msg = message.message;

        if (msg.conversation) {
            messageText = msg.conversation;
        } else if (msg.extendedTextMessage) {
            messageText = msg.extendedTextMessage.text;
        } else if (msg.imageMessage) {
            messageText = msg.imageMessage.caption || '';
        } else if (msg.videoMessage) {
            messageText = msg.videoMessage.caption || '';
        }

        if (!messageText) return;

        if (messageText === config.bot.prefix) {
            await sock.sendMessage(jid, {
                text: `👋 Hi! My prefix is *${config.bot.prefix}*\nUse *${config.bot.prefix}menu* to see available commands!`
            });
            return;
        }

        if (!messageText.startsWith(config.bot.prefix)) return;

        await simulateTyping(sock, jid);

        if (config.features?.presence?.autoRecord) {
            try {
                await sock.presenceSubscribe(jid);
                await sock.sendPresenceUpdate('recording', jid);
            } catch (error) {}
        }

        const [command, ...args] = messageText.slice(config.bot.prefix.length).trim().split(' ');
        
        if (command) {
            await executeCommand(sock, message, command.toLowerCase(), args);
        }

        if (config.features?.presence?.autoRecord) {
            try {
                await sock.sendPresenceUpdate('paused', jid);
            } catch (error) {}
        }
    } catch (error) {
        logger.error('Error in message handler:', error);
    }
}

async function handleGroupParticipantsUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        if (!id || !participants || !action) return;

        const groupMetadata = await sock.groupMetadata(id);
        if (!groupMetadata) return;

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
        logger.error('Error in group participants handler:', error);
    }
}

async function handleGroupUpdate(sock, update) {
    try {
        const { id, subject, desc } = update;
        if (!id) return;

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
