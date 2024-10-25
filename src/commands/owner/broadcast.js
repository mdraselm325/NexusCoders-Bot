module.exports = {
    name: 'broadcast',
    description: 'Broadcast a message to all users',
    usage: '!broadcast <message>',
    category: 'owner',
    ownerOnly: true,
    async execute(sock, message, args) {
        const User = require('../../models/user');
        
        if (args.length < 1) {
            await sock.sendMessage(message.key.remoteJid, { text: '❌ Please provide a message to broadcast' });
            return;
        }

        const broadcastMessage = args.join(' ');
        const users = await User.find({});
        let successCount = 0;
        let failCount = 0;

        await sock.sendMessage(message.key.remoteJid, { text: '📢 Starting broadcast...' });

        for (const user of users) {
            try {
                await sock.sendMessage(user.jid, {
                    text: `*🔊 BROADCAST MESSAGE*\n\n${broadcastMessage}`
                });
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                failCount++;
            }
        }

        await sock.sendMessage(message.key.remoteJid, {
            text: `📊 Broadcast completed\n\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`
        });
    }
};
