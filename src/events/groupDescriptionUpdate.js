const config = require('../config');

module.exports = {
    name: 'groupDescriptionUpdate',
    async execute(sock, group, newDesc) {
        try {
            const updateMsg = {
                text: `📝 Group description has been updated!\n\n*New Description:*\n${newDesc}`,
                contextInfo: {
                    externalAdReply: {
                        title: "Description Update",
                        body: "Group description changed",
                        showAdAttribution: true
                    }
                }
            };
            
            await sock.sendMessage(group, updateMsg);
        } catch (error) {
            console.error('Group description update event error:', error);
        }
    }
};
