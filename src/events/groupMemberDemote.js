const config = require('../config');

module.exports = {
    name: 'groupMemberDemote',
    async execute(sock, group, members) {
        try {
            const metadata = await sock.groupMetadata(group);
            for (const member of members) {
                const pp = await sock.profilePictureUrl(member, 'image').catch(() => 'https://whatsapp.com/channel/0029VarItlZ8fewz4nyakm1u');
                const msg = {
                    image: { url: pp },
                    caption: `┌──⭓ *ADMIN DEMOTION*
│
│ @${member.split('@')[0]} 
│ is no longer an admin
│
└──────────────⭓`,
                    mentions: [member],
                    headerType: 4,
                    contextInfo: {
                        externalAdReply: {
                            title: metadata.subject,
                            body: "Admin Demotion",
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
