module.exports = {
    name: 'broadcast',
    description: 'Broadcast message to all users',
    ownerOnly: true,
    async execute({ sock, msg, args, sender }) {
        if (!args.length) {
            await sock.sendMessage(sender, { text: 'Please provide a message to broadcast' });
            return;
        }

        const User = require('../../models/user');
        const users = await User.find({});
        const message = args.join(' ');
        let successful = 0;
        let failed = 0;

        for (const user of users) {
            try {
                await sock.sendMessage(user.jid, { text: `*[BROADCAST]*\n\n${message}` });
                successful++;
            } catch (error) {
                failed++;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await sock.sendMessage(sender, { 
            text: `Broadcast completed\nSuccessful: ${successful}\nFailed: ${failed}` 
        });
    }
};
