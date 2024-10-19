module.exports = {
    name: 'eval',
    description: 'Evaluate JavaScript code',
    ownerOnly: true,
    async execute({ sock, msg, args, sender }) {
        if (!args.join(' ')) {
            await sock.sendMessage(sender, { text: 'Provide code to evaluate' });
            return;
        }

        try {
            let evaled = await eval(args.join(' '));
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            await sock.sendMessage(sender, { text: evaled });
        } catch (error) {
            await sock.sendMessage(sender, { text: String(error) });
        }
    }
};
