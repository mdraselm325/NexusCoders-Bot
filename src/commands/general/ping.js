module.exports = {
    name: 'ping',
    description: 'Check bot response time',
    usage: 'ping',
    aliases: ['speed'],
    async execute({ sock, msg, chatId }) {
        const start = Date.now();
        const message = await sock.sendMessage(chatId, { text: 'Pinging...' });
        const latency = Date.now() - start;

        await sock.sendMessage(chatId, {
            text: `🏓 Pong!\nResponse Time: ${latency}ms`,
            edit: message.key
        });
    }
};
