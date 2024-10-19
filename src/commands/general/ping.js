module.exports = {
    name: 'ping',
    description: 'Check bot response time',
    async execute({ sock, msg, sender }) {
        const start = Date.now();
        await sock.sendMessage(sender, { text: 'Pinging...' });
        const end = Date.now();
        await sock.sendMessage(sender, { text: `Pong! 🏓\nResponse time: ${end - start}ms` });
    }
};
