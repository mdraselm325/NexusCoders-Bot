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

        // Link detection and actions if antilink is enabled
        if (antilinkEnabled) {
            const chatMessage = message.message?.conversation || message.message?.extendedTextMessage?.text;
            const linkRegex = /https?:\/\/[^\s]+/g;

            if (linkRegex.test(chatMessage)) {
                const sender = message.key.participant;
                const isBotAdmin = /* your function to check if bot is admin */ true; // Replace with actual check
                const isAdmins = /* your function to check if user is admin */ false; // Replace with actual check
                const isCreator = /* your function to check if user is creator */ false; // Replace with actual check

                if (!isBotAdmin) return; // Bot needs admin rights to manage participants
                
                // Custom messages for admins or special users
                const warningMsg = '```☠️ Link Detected ☠️```\n\nYou are a group admin, so I won’t kick you, but avoid sharing links next time.';
                
                if (isAdmins || message.key.fromMe || isCreator) {
                    await sock.sendMessage(message.key.remoteJid, { text: warningMsg, quoted: message });
                    return;
                }

                // Delete the link message
                await sock.sendMessage(message.key.remoteJid, {
                    delete: {
                        remoteJid: message.key.remoteJid,
                        fromMe: false,
                        id: message.key.id,
                        participant: message.key.participant
                    }
                });

                // Kick the user and notify the group
                try {
                    await sock.groupParticipantsUpdate(message.key.remoteJid, [sender], 'remove');
                    await sock.sendMessage(message.key.remoteJid, {
                        text: `🚫 Link Detected 🚫\n\n@${sender.split('@')[0]} *has been kicked for sending a link in this group.*`,
                        contextInfo: { mentionedJid: [sender] },
                        quoted: message
                    });
                } catch (error) {
                    console.error('Error kicking user:', error);
                    await sock.sendMessage(message.key.remoteJid, {
                        text: '❌ Failed to kick the user. Please check my permissions.',
                        quoted: message
                    });
                }
            }
        }
    }
};
                                           
