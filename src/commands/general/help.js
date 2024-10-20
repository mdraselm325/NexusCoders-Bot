const config = require('../../config');
const { commands } = require('../../handlers/commandHandler');

module.exports = {
    name: 'help',
    description: 'Shows list of available commands',
    usage: '!help [command]',
    cooldown: 5,
    category: 'general',
    async execute(sock, msg, args) {
        const sender = msg.key.remoteJid;
        
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName);
            
            if (command) {
                const helpText = `*Command: ${command.name}*\n` +
                               `Description: ${command.description}\n` +
                               `Usage: ${command.usage}\n` +
                               `Cooldown: ${command.cooldown || config.commandCooldown}s\n` +
                               `Category: ${command.category}`;
                               
                await sock.sendMessage(sender, { text: helpText });
                return;
            }
        }
        
        const categories = new Map();
        
        for (const [, command] of commands) {
            if (!categories.has(command.category)) {
                categories.set(command.category, []);
            }
            categories.get(command.category).push(command.name);
        }
        
        let helpText = `*${config.botName} - Command List*\n\n`;
        
        for (const [category, commandList] of categories) {
            helpText += `📑 *${category.toUpperCase()}*\n`;
            commandList.forEach(cmd => {
                helpText += `▢ ${config.prefix}${cmd}\n`;
            });
            helpText += '\n';
        }
        
        helpText += `\nUse ${config.prefix}help <command> for detailed info about a command.`;
        
        await sock.sendMessage(sender, { text: helpText });
    }
};
