const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Display available commands',
    async execute({ sock, msg, sender, args }) {
        const commandsPath = path.join(__dirname, '..');
        const categories = await fs.readdir(commandsPath);
        let helpText = '🤖 *NexusCoders Bot Commands*\n\n';

        for (const category of categories) {
            const commands = await fs.readdir(path.join(commandsPath, category));
            helpText += `*${category.toUpperCase()}*\n`;
            
            for (const cmd of commands) {
                if (!cmd.endsWith('.js')) continue;
                const command = require(path.join(commandsPath, category, cmd));
                helpText += `${config.prefix}${command.name} - ${command.description}\n`;
            }
            helpText += '\n';
        }

        await sock.sendMessage(sender, { text: helpText });
    }
};
