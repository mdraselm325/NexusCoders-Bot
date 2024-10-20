const User = require('../../models/user');
const config = require('../../config');

module.exports = {
    name: 'ban',
    description: 'Ban a user from using the bot',
    usage: '!ban @user [reason]',
    category: 'admin',
    adminOnly: true,
    
    async execute(sock, msg, args) {
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (!mentioned || !mentioned[0]) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Please mention a user to ban!' });
            return;
        }

        const targetUser = mentioned[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            let user = await User.findOne({ jid: targetUser });
            
            if (!user) {
                user = new User({ jid: targetUser });
            }

            if (user.isBanned) {
                await sock.sendMessage(msg.key.remoteJid, { text: '❌ User is already banned!' });
                return;
            }

            user.isBanned = true;
            await user.save();

            await sock.sendMessage(msg.key.remoteJid, { 
                text: `✅ User @${targetUser.split('@')[0]} has been banned!\nReason: ${reason}`,
                mentions: [targetUser]
            });

        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: config.messages.error });
        }
    }
};
