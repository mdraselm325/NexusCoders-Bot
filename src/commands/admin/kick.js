module.exports = {
    name: 'kick',
    description: 'Kick a user from the group',
    usage: '!kick @user',
    category: 'admin',
    groupOnly: true,
    adminOnly: true,
    
    async execute(sock, msg, args) {
        const group = msg.key.remoteJid;
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (!mentioned || !mentioned[0]) {
            await sock.sendMessage(group, { text: '❌ Please mention a user to kick!' });
            return;
        }

        try {
            const groupMetadata = await sock.groupMetadata(group);
            const isAdmin = groupMetadata.participants.find(
                p => p.id === sock.user.id
            )?.admin;

            if (!isAdmin) {
                await sock.sendMessage(group, { text: '❌ Bot needs to be admin to kick users!' });
                return;
            }

            await sock.groupParticipantsUpdate(group, mentioned, "remove");
            
            await sock.sendMessage(group, { 
                text: `✅ @${mentioned[0].split('@')[0]} has been kicked from the group!`,
                mentions: mentioned
            });
        } catch (error) {
            await sock.sendMessage(group, { text: '❌ Failed to kick user!' });
        }
    }
};
