module.exports = {
    name: 'add',
    description: 'Add member to group',
    groupOnly: true,
    async execute({ sock, msg, args, sender }) {
        const groupMetadata = await sock.groupMetadata(sender);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: 'Admin only command' });
            return;
        }

        if (!args[0]) {
            await sock.sendMessage(sender, { text: 'Provide number to add' });
            return;
        }

        const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        try {
            await sock.groupParticipantsUpdate(sender, [number], 'add');
            await sock.sendMessage(sender, { text: 'Member added successfully' });
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to add member' });
        }
    }
};
