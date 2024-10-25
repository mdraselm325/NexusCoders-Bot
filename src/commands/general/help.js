const { getCommands } = require('../../handlers/commandHandler');
const config = require('../../config');

module.exports = {
    name: 'help',
    description: 'Display all available commands',
    usage: '!help [command]',
    category: 'general',
    async execute(sock, message, args) {
        const commands = getCommands();
        const categories = {};
        
        commands.forEach(cmd => {
            if (!categories[cmd.category]) {
                categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
        });

        const helpImage = {
            url: 'https://example.com/bot-banner.jpg'
        };

        if (args.length === 0) {
            let helpText = `🤖 *${config.botName} Commands*\n\n`;
            
            for (const [category, cmds] of Object.entries(categories)) {
                helpText += `*${category.toUpperCase()}*\n`;
                cmds.forEach(cmd => {
                    helpText += `➤ ${config.prefix}${cmd.name}: ${cmd.description}\n`;
                });
                helpText += '\n';
            }
            
            helpText += `\nType ${config.prefix}help <command> for detailed info about a command.`;

            await sock.sendMessage(message.key.remoteJid, {
                image: helpImage,
                caption: helpText
            });
        } else {
            const commandName = args[0].toLowerCase();
            const command = commands.find(cmd => cmd.name === commandName);
            
            if (!command) {
                await sock.sendMessage(message.key.remoteJid, {
                    text: `❌ Command "${commandName}" not found.`
                });
                return;
            }

            const helpText = `*Command: ${command.name}*\n\n` +
                           `Description: ${command.description}\n` +
                           `Usage: ${command.usage}\n` +
                           `Category: ${command.category}\n` +
                           (command.aliases ? `Aliases: ${command.aliases.join(', ')}\n` : '') +
                           (command.cooldown ? `Cooldown: ${command.cooldown}s\n` : '');

            await sock.sendMessage(message.key.remoteJid, {
                image: helpImage,
                caption: helpText
            });
        }
    }
};
