const config = require('../../config');

module.exports = {
    name: 'broadcast',
    description: 'Broadcast a message to all chats',
    usage: '!broadcast <message>',
    category: 'owner',
    ownerOnly: true,
    
    async execute(sock, msg, args) {
        if (args.length < 1) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Please provide a message to broadcast!' });
            return;
        }

        const message = args.join(' ');
        const broadcastMessage = `*[BROADCAST MESSAGE]*\n\n${message}\n\n_This is a broadcast message from the bot owner._`;

        try {
            const chats = await sock.groupFetchAllParticipating();
            let successCount = 0;
            let failCount = 0;

            for (const [jid] of Object.entries(chats)) {
                try {
                    await sock.sendMessage(jid, { text: broadcastMessage });
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch {
                    failCount++;
                }
            }

            const summary = `📢 Broadcast Summary\n\n` +
                          `✅ Successfully sent: ${successCount}\n` +
                          `❌ Failed: ${failCount}\n` +
                          `📝 Message: ${message.substring(0, 50)}...`;

            await sock.sendMessage(msg.key.remoteJid, { text: summary });

        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: config.messages.error });
        }
    }
};
