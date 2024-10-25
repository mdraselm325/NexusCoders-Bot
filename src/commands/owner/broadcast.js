const User = require('../../models/user');

module.exports = {
    name: 'broadcast',
    description: 'Broadcast a message to all users',
    usage: '!broadcast <message>',
    category: 'owner',
    ownerOnly: true,
    async execute(sock, message, args) {
        if (args.length === 0) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Please provide a message to broadcast'
            });
            return;
        }

        const broadcastMessage = args.join(' ');
        const users = await User.find({});
        let successCount = 0;
        let failCount = 0;

        const progress = await sock.sendMessage(message.key.remoteJid, {
            text: '📢 Broadcasting message...'
        });

        for (const user of users) {
            try {
                await sock.sendMessage(user.jid, {
                    text: `📢 *NexusCoders Bot Broadcast*\n\n${broadcastMessage}`
                });
                successCount++;
                
                if (successCount % 10 === 0) {
                    await sock.sendMessage(message.key.remoteJid, {
                        text: `📢 Progress: ${successCount}/${users.length}`,
                        edit: progress.key
                    });
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                failCount++;
            }
        }

        await sock.sendMessage(message.key.remoteJid, {
            text: `📢 Broadcast completed!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`,
            edit: progress.key
        });
    }
};
