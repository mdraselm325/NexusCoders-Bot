module.exports = {
    name: 'sticker',
    description: 'Convert image to sticker',
    usage: '!sticker',
    category: 'general',
    async execute(sock, message, args) {
        const quoted = message.message.imageMessage || message.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        
        if (!quoted) {
            return await sock.sendMessage(message.key.remoteJid, { text: 'Send or reply to an image with !sticker' });
        }
        
        const media = await sock.downloadMediaMessage(quoted);
        const sticker = {
            sticker: media,
            mimetype: 'image/webp'
        };
        
        await sock.sendMessage(message.key.remoteJid, sticker);
    }
};
