module.exports = {
    name: 'add',
    description: 'Add a user to the group',
    usage: '!add number',
    category: 'admin',
    groupOnly: true,
    adminOnly: true,
    
    async execute(sock, msg, args) {
        const group = msg.key.remoteJid;
        
        if (!args[0]) {
            await sock.sendMessage(group, { text: '❌ Please provide a number to add!' });
            return;
        }

        let user = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        try {
            const groupMetadata = await sock.groupMetadata(group);
            const isAdmin = groupMetadata.participants.find(
                p => p.id === sock.user.id
            )?.admin;

            if (!isAdmin) {
                await sock.sendMessage(group, { text: '❌ Bot needs to be admin to add users!' });
                return;
            }

            await sock.groupParticipantsUpdate(group, [user], "add");
            
            await sock.sendMessage(group, { 
                text: `✅ @${user.split('@')[0]} has been added to the group!`,
                mentions: [user]
            });
        } catch (error) {
            await sock.sendMessage(group, { 
                text: `❌ Failed to add user! Error: ${error.message}`
            });
        }
    }
};
