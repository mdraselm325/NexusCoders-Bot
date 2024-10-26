module.exports = {
    name: 'broadcast',
    description: 'Broadcast a message to all groups',
    usage: '!broadcast <message>',
    category: 'owner',
    ownerOnly: true,
    async execute(sock, message, args) {
        if (!args.length) return await sock.sendMessage(message.key.remoteJid, { text: 'Please provide a message to broadcast' });
        
        const broadcastMessage = args.join(' ');
        const groups = await sock.groupFetchAllParticipating();
        
        for (let group of Object.values(groups)) {
            await sock.sendMessage(group.id, { text: broadcastMessage });
        }
        
        await sock.sendMessage(message.key.remoteJid, { text: 'Broadcast sent successfully!' });
    }
};
