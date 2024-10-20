const config = require('../config');

const messages = {
    startupMessage: `
🤖 ${config.botName} v${config.version}
━━━━━━━━━━━━━━━
📱 Status: Online
⚡ Prefix: ${config.prefix}
👑 Owner: ${config.owner.name}
━━━━━━━━━━━━━━━
Type ${config.prefix}help for commands
    `,

    noPermission: "⚠️ You don't have permission to use this command.",
    cooldown: (time) => `⏰ Please wait ${time} seconds before using this command again.`,
    error: "❌ An error occurred while processing your request.",
    banned: "🚫 You are banned from using the bot.",
    ownerOnly: "👑 This command can only be used by the bot owner.",
    adminOnly: "⚠️ This command can only be used by group admins.",
    groupOnly: "👥 This command can only be used in groups.",
    privateOnly: "📱 This command can only be used in private chat.",
    
    help: {
        header: `
━━━ ${config.botName} Help ━━━
Prefix: ${config.prefix}
        `,
        category: (name) => `\n━━━ ${name} Commands ━━━\n`,
        command: (cmd) => `${config.prefix}${cmd.name} ${cmd.usage || ''}
└ ${cmd.description}\n`,
        footer: `
━━━━━━━━━━━━━━━
For more info about a command:
${config.prefix}help <command>
        `
    },

    ban: {
        success: "✅ User has been banned from using the bot.",
        already: "⚠️ User is already banned.",
        notBanned: "⚠️ User is not banned.",
        unbanned: "✅ User has been unbanned."
    }
};

module.exports = messages;
