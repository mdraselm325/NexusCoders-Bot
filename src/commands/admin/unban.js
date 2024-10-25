module.exports = {
    name: 'ban',
    description: 'Ban a user from using the bot',
    usage: '!ban @user [reason]',
    category: 'admin',
    adminOnly: true,
    async execute(sock, message, args) {
        const User = require('../../models/user');
        
        const mentioned = message.message.extendedTextMessage?.contextInfo?.mentionedJid[0];
        if (!mentioned) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ Please mention a user to ban' });
            return;
        }

        const user = await User.findOne({ jid: mentioned });
        if (!user) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ User not found in database' });
            return;
        }

        if (user.isAdmin) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ Cannot ban an admin' });
            return;
        }

        user.isBanned = true;
        user.banReason = args.slice(1).join(' ') || 'No reason provided';
        await user.save();

        await sock.sendMessage(message.key.remoteJid, { 
            text: `✅ Successfully banned ${user.name}\nReason: ${user.banReason}` 
        });
    }
};
