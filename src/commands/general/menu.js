module.exports = {
    name: 'menu',
    description: 'Display bot menu with all commands',
    usage: '!menu',
    category: 'general',
    async execute(sock, message, args) {
        const commands = require('../../handlers/commandHandler').getCommands();
        const categories = {};
        
        commands.forEach(cmd => {
            if (!categories[cmd.category]) {
                categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
        });

        const categoryEmojis = {
            general: '🔰',
            admin: '👑',
            owner: '💎',
            fun: '🎮',
            utility: '🛠️',
            AI: '🤖',
            game: '🎲',
            music: '🎵',
            economy: '💰',
            moderation: '🛡️'
        };

        let menuText = `╭━━━❰ *NEXUSCODERS BOT* ❱━━━┈ ⊷
┃ *User:* @${message.key.participant?.split('@')[0] || message.key.remoteJid?.split('@')[0]}
┃ *Role:* ${message.isGroup ? (message.participant ? 'Member' : 'Admin') : 'User'}
┃ *Bot:* ${config.botName}
┃ *Prefix:* ${config.bot.prefix}
┃ *Time:* ${new Date().toLocaleTimeString()}
┃ *Commands:* ${commands.length}
╰━━━━━━━━━━━━━━┈ ⊷\n\n`;

        for (const [category, cmds] of Object.entries(categories)) {
            menuText += `╭━━━❰ ${categoryEmojis[category.toLowerCase()] || '📁'} *${category.toUpperCase()}* ❱━━━┈ ⊷\n`;
            cmds.forEach(cmd => {
                menuText += `┃ ❏ ${config.bot.prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage.split(' ').slice(1).join(' ')}` : ''}\n`;
            });
            menuText += `╰━━━━━━━━━━━━━━┈ ⊷\n\n`;
        }

        menuText += `╭━━━❰ *NOTE* ❱━━━┈ ⊷
┃ Type ${config.bot.prefix}help <command>
┃ for detailed command info
╰━━━━━━━━━━━━━━┈ ⊷`;

        const templateButtons = [
            {
                index: 1,
                urlButton: {
                    displayText: '🌟 Join NexusCoders Channel',
                    url: 'https://whatsapp.com/channel/0029VarItlZ8fewz4nyakm1u'
                }
            },
            {
                index: 2,
                quickReplyButton: {
                    displayText: '👑 Bot Owner',
                    id: 'owner'
                }
            }
        ];

        await sock.sendMessage(message.key.remoteJid, {
            image: { url: 'https://tiny.one/32ycxnt3' },
            caption: menuText,
            footer: `© ${new Date().getFullYear()} NexusCoders Team`,
            templateButtons: templateButtons,
            mentions: [message.key.participant || message.key.remoteJid],
            quoted: message
        });
    }
};
