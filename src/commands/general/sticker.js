module.exports = {
    name: 'sticker',
    description: 'Convert image/video to sticker',
    usage: '!sticker [crop]',
    category: 'general',
    aliases: ['s'],
    cooldown: 10,
    async execute(sock, message, args) {
        const quoted = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const content = quoted || message.message;
        
        if (!content.imageMessage && !content.videoMessage) {
            return await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Please reply to an image or video!'
            });
        }

        await sock.sendMessage(message.key.remoteJid, {
            text: '⏳ Creating sticker...'
        });

        const options = {
            pack: 'NexusCoders',
            author: 'Bot',
            type: 'full',
            categories: ['🤖'],
            quality: 70,
        };

        if (args.includes('crop')) {
            options.type = 'crop';
        }

        try {
            const buffer = await downloadMediaMessage(message, 'buffer');
            const sticker = await createSticker(buffer, options);
            
            await sock.sendMessage(message.key.remoteJid, {
                sticker: sticker
            });
        } catch (error) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Failed to create sticker!'
            });
        }
    }
};
