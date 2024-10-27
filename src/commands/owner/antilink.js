const axios = require('axios');

let antilinkEnabled = false; // Toggle variable for antilink

module.exports = {
    name: 'antilink',
    description: 'Toggle antilink feature or kick users who send links in the group',
    usage: '!antilink <on/off>',
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

        // Toggle antilink based on args
        if (args[0] === 'on') {
            antilinkEnabled = true;
            await sock.sendMessage(message.key.remoteJid, { 
                text: '✅ Antilink has been activated.',
                quoted: message 
            });
            return;
        } else if (args[0] === 'off') {
            antilinkEnabled = false;
            await sock.sendMessage(message.key.remoteJid, { 
                text: '🚫 Antilink has been deactivated.',
                quoted: message 
            });
            return;
        }

        // Check if antilink is enabled before proceeding
        if (antilinkEnabled) {
            const chatMessage = message.message?.conversation || message.message?.extendedTextMessage?.text;
            const linkRegex = /https?:\/\/[^\s]+/g;

            if (linkRegex.test(chatMessage)) {
                const sender = message.key.participant;

                // Warn and kick the user
                await sock.sendMessage(message.key.remoteJid, {
                    text: `🚫 @${sender.split('@')[0]} sent a link and has been kicked.`,
                    mentions: [sender],
                    quoted: message
                });

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
        } else {
            // If antilink is not enabled, ignore link messages
            console.log("Antilink is currently disabled.");
        }
    }
};
