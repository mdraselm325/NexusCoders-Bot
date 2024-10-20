const { banUser } = require('../../models/user');
const messages = require('../../utils/messages');

module.exports = {
    name: 'ban',
    description: 'Ban a user from using the bot',
    usage: '@user [reason]',
    permission: 'admin',
    category: 'admin',
    async execute({ sock, msg, args }) {
        if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Please mention a user to ban' });
            return;
        }

        const userToBan = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await banUser(userToBan, reason);
            await sock.sendMessage(msg.key.remoteJid, { text: messages.ban.success });
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: messages.error });
        }
    }
};
