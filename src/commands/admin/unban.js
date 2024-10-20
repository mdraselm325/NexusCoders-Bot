const User = require('../../models/user');
const config = require('../../config');

module.exports = {
    name: 'unban',
    description: 'Unban a user from using the bot',
    usage: '!unban @user',
    category: 'admin',
    adminOnly: true,
    
    async execute(sock, msg, args) {
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (!mentioned || !mentioned[0]) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Please mention a user to unban!' });
            return;
        }

        const targetUser = mentioned[0];

        try {
            const user = await User.findOne({ jid: targetUser });
            
            if (!user || !user.isBanned) {
                await sock.sendMessage(msg.key.remoteJid, { text: '❌ User is not banned!' });
                return;
            }

            user.isBanned = false;
            await user.save();

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ User @${targetUser.split('@')[0]} has been unbanned!`,
                mentions: [targetUser]
            });

        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: config.messages.error });
        }
    }
};
