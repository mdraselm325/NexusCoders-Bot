module.exports = {
    name: 'dice',
    description: 'Roll a dice',
    usage: '!dice [number of dice]',
    category: 'fun',
    async execute(sock, message, args) {
        const count = parseInt(args[0]) || 1;
        if (count > 10) return await sock.sendMessage(message.key.remoteJid, { text: 'Maximum 10 dice allowed' });
        
        let results = [];
        for (let i = 0; i < count; i++) {
            results.push(Math.floor(Math.random() * 6) + 1);
        }
        
        await sock.sendMessage(message.key.remoteJid, { 
            text: `🎲 Dice results: ${results.join(', ')}\nTotal: ${results.reduce((a, b) => a + b, 0)}` 
        });
    }
};
