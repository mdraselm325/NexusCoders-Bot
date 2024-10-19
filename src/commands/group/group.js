module.exports = {
    name: 'group',
    description: 'Group management commands',
    groupOnly: true,
    async execute({ sock, msg, args, sender }) {
        const groupId = sender;
        const groupMetadata = await sock.groupMetadata(groupId);
        const isAdmin = groupMetadata.participants.find(p => p.id === msg.key.participant)?.admin;
        
        if (!isAdmin) {
            await sock.sendMessage(sender, { text: 'This command is only for admins' });
            return;
        }

        switch (args[0]?.toLowerCase()) {
            case 'close':
                await sock.groupSettingUpdate(groupId, 'announcement');
                await sock.sendMessage(sender, { text: '✅ Group closed successfully' });
                break;

            case 'open':
                await sock.groupSettingUpdate(groupId, 'not_announcement');
                await sock.sendMessage(sender, { text: '✅ Group opened successfully' });
                break;

            case 'link':
                const code = await sock.groupInviteCode(groupId);
                await sock.sendMessage(sender, { 
                    text: `https://chat.whatsapp.com/${code}` 
                });
                break;

            default:
                await sock.sendMessage(sender, { 
                    text: `*Group Commands*\n${config.prefix}group close\n${config.prefix}group open\n${config.prefix}group link` 
                });
        }
    }
};
