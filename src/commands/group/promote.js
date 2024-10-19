module.exports = {
    name: 'promote',
    description: 'Promote member to admin',
    groupOnly: true,
    async execute({ sock, msg, sender }) {
        const groupMetadata = await sock.groupMetadata(sender);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: 'Admin only command' });
            return;
        }

        if (!msg.message.extendedTextMessage) {
            await sock.sendMessage(sender, { text: 'Tag member to promote' });
            return;
        }

        const target = msg.message.extendedTextMessage.contextInfo.participant;

        try {
            await sock.groupParticipantsUpdate(sender, [target], 'promote');
            await sock.sendMessage(sender, { text: 'Member promoted to admin' });
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to promote member' });
        }
    }
};
