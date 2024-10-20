module.exports = {
    name: 'ping',
    description: 'Check bot response time',
    usage: '!ping',
    cooldown: 5,
    category: 'general',
    
    async execute(sock, msg) {
        const start = Date.now();
        
        await sock.sendMessage(msg.key.remoteJid, { text: '📡 Pinging...' });
        
        const end = Date.now();
        const responseTime = end - start;
        
        const pingMessage = `🏓 Pong!\n\n` +
                          `📊 Response Time: ${responseTime}ms\n` +
                          `🔌 API Latency: ${Math.round(sock.ws.ping)}ms\n` +
                          `💾 Uptime: ${Math.floor(process.uptime())}s`;
        
        await sock.sendMessage(msg.key.remoteJid, { text: pingMessage });
    }
};
