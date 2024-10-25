module.exports = {
    name: 'unban',
    description: 'Unban a user from using the bot',
    usage: '!unban @user',
    category: 'admin',
    adminOnly: true,
    async execute(sock, message, args) {
        const User = require('../../models/user');
        
        const mentioned = message.message.extendedTextMessage?.contextInfo?.mentionedJid[0];
        if (!mentioned) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ Please mention a user to unban' });
            return;
        }

        const user = await User.findOne({ jid: mentioned });
        if (!user) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ User not found in database' });
            return;
        }

        if (!user.isBanned) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ User is not banned' });
            return;
        }

        user.isBanned = false;
        user.banReason = null;
        await user.save();

        await sock.sendMessage(message.key.remoteJid, { 
            text: `✅ Successfully unbanned ${user.name}` 
        });
    }
};
