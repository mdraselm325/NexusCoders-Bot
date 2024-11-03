const config = require('../config');

module.exports = {
    name: 'groupMemberLeave',
    async execute(sock, group, member) {
        try {
            const memberName = member.split('@')[0];
            
            const leaveMsg = {
                text: `👋 Goodbye @${memberName}! We'll miss you!`,
                mentions: [member],
                contextInfo: {
                    externalAdReply: {
                        title: "Member Left",
                        body: `Farewell ${memberName}`,
                        showAdAttribution: true
                    }
                }
            };
            
            await sock.sendMessage(group, leaveMsg);
        } catch (error) {
            console.error('Member leave event error:', error);
        }
    }
};
