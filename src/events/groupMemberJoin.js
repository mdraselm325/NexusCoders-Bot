const config = require('../config');

module.exports = {
    name: 'groupMemberJoin',
    async execute(sock, group, member) {
        try {
            const groupMetadata = await sock.groupMetadata(group);
            const pp = await sock.profilePictureUrl(member, 'image').catch(() => 'https://i.ibb.co/Tq7d7TW/age-hananta-495-photo.png');
            const memberName = member.split('@')[0];
            
            const welcomeMsg = {
                image: { url: pp },
                caption: `╭───────────────◆
│ *Welcome to ${groupMetadata.subject}*
├───────────────◆
│ *Name:* @${memberName}
│ *Members:* ${groupMetadata.participants.length}
│ *Join Date:* ${new Date().toLocaleDateString()}
╰───────────────◆

Use ${config.bot.prefix}menu for commands`,
                mentions: [member],
                headerType: 4
            };
            
            // Send a separate message for the welcome message
            await sock.sendMessage(group, welcomeMsg);
            
            // Send the context info in a separate message if needed
            const contextMsg = {
                text: `Welcome to ${groupMetadata.subject}`,
                contextInfo: {
                    externalAdReply: {
                        title: "Welcome to " + groupMetadata.subject,
                        body: "NexusCoders Bot",
                        mediaUrl: pp,
                        sourceUrl: "https://github.com/NexusCoders",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            };
            
            await sock.sendMessage(group, contextMsg);
        } catch (error) {
            console.error('Welcome event error:', error);
        }
    }
};
