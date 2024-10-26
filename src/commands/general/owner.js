module.exports = {
    name: 'owner',
    description: 'Get bot owner information',
    usage: '!owner',
    category: 'general',
    async execute(sock, message, args) {
        const config = require('../../config');
        
        const ownerInfo = `╭━━━❰ *BOT OWNER* ❱━━━┈ ⊷
┃ 
┃ *👑 Name:* ${config.bot.ownerName}
┃ *📱 Number:* wa.me/${config.bot.ownerNumber[0].split('@')[0]}
┃ *🤖 Bot Name:* ${config.botName}
┃ *📍 Region:* International
┃ 
┃ For business inquiries or support,
┃ contact the owner directly.
╰━━━━━━━━━━━━━━┈ ⊷`;

        const templateButtons = [
            {
                index: 1,
                urlButton: {
                    displayText: '💬 Contact Owner',
                    url: `https://wa.me/${config.bot.ownerNumber[0].split('@')[0]}`
                }
            },
            {
                index: 2,
                urlButton: {
                    displayText: '🌟 Join Channel',
                    url: 'https://whatsapp.com/channel/0029VarItlZ8fewz4nyakm1u'
                }
            }
        ];

        await sock.sendMessage(message.key.remoteJid, {
            image: { url: 'https://tiny.one/32ycxnt3' },
            caption: ownerInfo,
            footer: '© NexusCoders Team',
            templateButtons: templateButtons,
            quoted: message
        });
    }
};
