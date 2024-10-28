const axios = require('axios');
module.exports = {
    name: 'antilink',
    description: 'Toggle antilink protection to kick users who send links',
    usage: '!antilink <on/off>',
    category: 'Moderation',
    cooldown: 5,
    aliases: ['alink', 'linkblock'],
    async execute(sock, message, args, isAntilinkOn) {
        const commandInput = args[0]?.toLowerCase();

        if (commandInput === 'on') {
            isAntilinkOn = true;
            await sock.sendMessage(message.key.remoteJid, { 
                text: '🔒 Antilink protection is now *ON*.',
                quoted: message 
            });
        } else if (commandInput === 'off') {
            isAntilinkOn = false;
            await sock.sendMessage(message.key.remoteJid, { 
                text: '🔓 Antilink protection is now *OFF*.',
                quoted: message 
            });
        } else {
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Please specify `on` or `off` to toggle antilink protection.',
                quoted: message 
            });
        }
    },
    async checkForLinks(sock, message, isAntilinkOn) {
        if (!isAntilinkOn) return;

        const linkPattern = /https?:\/\/[^\s]+/;
        if (linkPattern.test(message.body)) {
            const groupId = message.key.remoteJid;
            const senderId = message.key.participant;

            try {
                await sock.groupParticipantsUpdate(groupId, [senderId], 'remove');
                await sock.sendMessage(groupId, {
                    text: `🚫 User removed for sending a link:\n@${senderId.split('@')[0]}`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('Failed to kick user:', error);
            }
        }
    }
};
