module.exports = {
    name: 'viewonce',
    description: 'Opens and saves a view-once image from a message',
    usage: '!vv',
    category: 'Utility',
    cooldown: 5,
    async execute(sock, message) {
        if (!message.message || !message.message.imageMessage || !message.message.imageMessage.viewOnce) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ This command can only be used on a view-once image.',
                quoted: message
            });
            return;
        }

        try {
            const mediaMessage = await sock.downloadMediaMessage(message);
            await sock.sendMessage(message.key.remoteJid, {
                image: mediaMessage,
                caption: '📸 Here’s the saved view-once image.',
                quoted: message
            });
        } catch (error) {
            console.error('Failed to open view-once image:', error);
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Could not open the view-once image. Please try again.',
                quoted: message
            });
        }
    }
};
