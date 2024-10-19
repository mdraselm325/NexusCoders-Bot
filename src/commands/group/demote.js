module.exports = {
    name: 'demote',
    description: 'Demote admin to member',
    groupOnly: true,
    async execute({ sock, msg, sender }) {
        const groupMetadata = await sock.groupMetadata(sender);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: 'Admin only command' });
            return;
        }

        if (!msg.message.extendedTextMessage) {
            await sock.sendMessage(sender, { text: 'Tag admin to demote' });
            return;
        }

        const target = msg.message.extendedTextMessage.contextInfo.participant;

        try {
            await sock.groupParticipantsUpdate(sender, [target], 'demote');
            await sock.sendMessage(sender, { text: 'Admin demoted to member' });
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to demote admin' });
        }
    }
};
