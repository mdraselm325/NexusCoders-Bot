const config = require('../config');

module.exports = {
    name: 'groupSettings',
    async execute(sock, group, settings) {
        try {
            const { restrict, announce } = settings;
            const metadata = await sock.groupMetadata(group);
            
            const msg = {
                text: `*Group Settings Updated*\n${
                    restrict !== undefined ? 
                    `\n${restrict ? '🔒 Group is now restricted to admins' : '🔓 Group is now open to everyone'}` : ''
                }${
                    announce !== undefined ?
                    `\n${announce ? '🔇 Group is now announcement only' : '🔈 Group is now open for all members'}` : ''
                }`,
                contextInfo: {
                    externalAdReply: {
                        title: metadata.subject,
                        body: "Group Settings Update",
                        mediaType: 1,
                        showAdAttribution: true
                    }
                }
            };
            
            await sock.sendMessage(group, msg);
        } catch (error) {}
    }
};
