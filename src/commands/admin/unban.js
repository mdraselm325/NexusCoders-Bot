module.exports = {
    name: 'unban',
    description: 'Unban a user',
    ownerOnly: true,
    async execute({ sock, msg, args, sender }) {
        if (!msg.message.extendedTextMessage && !args[0]) {
            await sock.sendMessage(sender, { text: 'Tag a user or provide their number' });
            return;
        }

        const User = require('../../models/user');
        const target = msg.message.extendedTextMessage?.contextInfo?.participant || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        try {
            const user = await User.findOneAndUpdate(
                { jid: target },
                { banned: false },
                { upsert: true, new: true }
            );

            await sock.sendMessage(sender, { 
                text: `Successfully unbanned ${target.split('@')[0]}` 
            });
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to unban user' });
        }
    }
};
