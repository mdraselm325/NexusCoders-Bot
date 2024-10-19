module.exports = {
    name: 'setdesc',
    description: 'Change group description',
    groupOnly: true,
    async execute({ sock, msg, args, sender }) {
        const groupMetadata = await sock.groupMetadata(sender);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: 'Admin only command' });
            return;
        }

        if (!args.length) {
            await sock.sendMessage(sender, { text: 'Provide new group description' });
            return;
        }

        try {
            await sock.groupUpdateDescription(sender, args.join(' '));
            await sock.sendMessage(sender, { text: 'Group description changed successfully' });
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to change group description' });
        }
    }
};
