module.exports = {
    name: 'coinflip',
    description: 'Flip a coin',
    usage: '!coinflip',
    category: 'fun',
    async execute(sock, message, args) {
        try {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            const coinEmoji = result === 'Heads' ? '🪙' : '💿';
            
            const flipText = `*Coin Flip Result*\n\n${coinEmoji} ${result}!`;
            
            await sock.sendMessage(message.key.remoteJid, {
                text: flipText
            });
        } catch (error) {
            await sock.sendMessage(message.key.remoteJid, {
                text: 'Error flipping coin!'
            });
        }
    }
};
