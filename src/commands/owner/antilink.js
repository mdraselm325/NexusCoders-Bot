const axios = require('axios');

module.exports = {
    name: 'antilink',
    description: 'Kick users who send links in the group',
    usage: '!antilink',
    category: 'Moderation',
    cooldown: 5,
    async execute(sock, message, args) {
        // Check if the message is from a group
        if (!message.key.remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ This command can only be used in group chats.',
                quoted: message 
            });
            return;
        }

        const chatMessage = message.message?.conversation || message.message?.extendedTextMessage?.text;
        // Check if the message contains a link
        const linkRegex = /https?:\/\/[^\s]+/g;
        if (linkRegex.test(chatMessage)) {
            const sender = message.key.participant;

            // Send a warning message to the group
            await sock.sendMessage(message.key.remoteJid, {
                text: `🚫 @${sender.split('@')[0]} sent a link and has been kicked.`,
                mentions: [sender],
                quoted: message
            });

            // Kick the user from the group
            try {
                await sock.groupParticipantsUpdate(message.key.remoteJid, [sender], 'remove');
            } catch (error) {
                console.error('Error kicking user:', error);
                await sock.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to kick the user. Please check my permissions.',
                    quoted: message
                });
            }
        }
    }
};
