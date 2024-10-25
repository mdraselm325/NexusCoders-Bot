module.exports = {
    name: 'help',
    description: 'Display all available commands',
    usage: '!help [command]',
    category: 'general',
    async execute(sock, message, args) {
        const { getCommands } = require('../../handlers/commandHandler');
        const config = require('../../config');
        
        const commands = getCommands();
        const categories = {};
        
        commands.forEach(cmd => {
            if (!categories[cmd.category]) {
                categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
        });

        const botImage = {
            url: 'https://i.ibb.co/your-bot-image-url'
        };

        if (args.length === 0) {
            const sections = [];
            let cmdCount = 0;

            for (const [category, cmds] of Object.entries(categories)) {
                const rows = cmds.map(cmd => ({
                    title: `${config.prefix}${cmd.name}`,
                    description: cmd.description,
                    rowId: `${config.prefix}help ${cmd.name}`
                }));
                cmdCount += cmds.length;

                sections.push({
                    title: category.toUpperCase(),
                    rows: rows
                });
            }

            const listMessage = {
                image: botImage,
                caption: `🤖 *${config.botName}*\n\n` +
                        `👋 Hello @${message.key.participant?.split('@')[0] || message.key.remoteJid?.split('@')[0]}!\n\n` +
                        `📚 Total Commands: ${cmdCount}\n` +
                        `🔧 Prefix: ${config.prefix}\n` +
                        `👑 Owner: ${config.bot.ownerName}\n\n` +
                        `Select a category below to view commands`,
                footer: `© ${new Date().getFullYear()} ${config.bot.ownerName}`,
                mentions: [message.key.participant || message.key.remoteJid],
                buttonText: "Command List",
                sections,
                listType: 1
            };

            await sock.sendMessage(message.key.remoteJid, listMessage);
        } else {
            const commandName = args[0].toLowerCase();
            const command = commands.find(cmd => cmd.name === commandName);
            
            if (!command) {
                await sock.sendMessage(message.key.remoteJid, {
                    text: `❌ Command "${commandName}" not found.`
                });
                return;
            }

            const helpText = `📖 *Command Details*\n\n` +
                           `🔧 *Command:* ${command.name}\n` +
                           `📝 *Description:* ${command.description}\n` +
                           `💡 *Usage:* ${command.usage}\n` +
                           `📁 *Category:* ${command.category}\n` +
                           (command.aliases ? `🔄 *Aliases:* ${command.aliases.join(', ')}\n` : '') +
                           (command.cooldown ? `⏰ *Cooldown:* ${command.cooldown}s\n` : '') +
                           (command.adminOnly ? '👑 *Admin Only:* Yes\n' : '') +
                           (command.ownerOnly ? '💎 *Owner Only:* Yes\n' : '');

            await sock.sendMessage(message.key.remoteJid, {
                image: botImage,
                caption: helpText
            });
        }
    }
};
