const config = require('../config');

module.exports = {
    name: 'groupMemberPromote',
    async execute(sock, group, members) {
        try {
            const metadata = await sock.groupMetadata(group);
            for (const member of members) {
                const pp = await sock.profilePictureUrl(member, 'image').catch(() => 'https://i.ibb.co/Tq7d7TW/age-hananta-495-photo.png');
                const msg = {
                    image: { url: pp },
                    caption: `┌──⭓ *ADMIN PROMOTION*
│
│ @${member.split('@')[0]} 
│ has been promoted to admin
│
└──────────────⭓`,
                    mentions: [member],
                    headerType: 4,
                    contextInfo: {
                        externalAdReply: {
                            title: metadata.subject,
                            body: "Admin Promotion",
                            mediaType: 1,
                            showAdAttribution: true,
                            thumbnail: pp
                        }
                    }
                };
                await sock.sendMessage(group, msg);
            }
        } catch (error) {}
    }
};
