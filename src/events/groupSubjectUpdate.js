const config = require('../config');

module.exports = {
    name: 'groupSubjectUpdate',
    async execute(sock, group, newSubject) {
        try {
            const updateMsg = {
                text: `✨ Group name has been updated to: *${newSubject}*`,
                contextInfo: {
                    externalAdReply: {
                        title: "Group Name Update",
                        body: newSubject,
                        showAdAttribution: true
                    }
                }
            };
            
            await sock.sendMessage(group, updateMsg);
        } catch (error) {
            console.error('Group subject update event error:', error);
        }
    }
};
