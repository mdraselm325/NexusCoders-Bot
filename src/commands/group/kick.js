module.exports = {
    name: 'kick',
    description: 'Kick a member from the group',
    groupOnly: true,
    async execute({ sock, msg, sender }) {
        const groupMetadata = await sock.groupMetadata(sender);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: 'This command is only for admins' });
            return;
        }

        if (!msg.message.extendedTextMessage) {
            await sock.sendMessage(sender, { text: 'Tag the person you want to kick' });
            return;
        }

        const target = msg.message.extendedTextMessage.contextInfo.participant;
        const targetAdmin = groupMetadata.participants.find(p => p.id === target)?.admin;

        if (targetAdmin) {
            await sock.sendMessage(sender, { text: 'Cannot kick an admin' });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(sender, [target], 'remove');
            await sock.sendMessage(sender, { text: '✅ Member kicked successfully' });
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to kick member' });
        }
    }
};
