const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

let commands = new Map();

async function initializeCommands() {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const categories = await fs.readdir(commandsPath);

    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        const commandFiles = await fs.readdir(categoryPath);

        for (const file of commandFiles) {
            if (!file.endsWith('.js')) continue;
            try {
                const command = require(path.join(categoryPath, file));
                commands.set(command.name, command);
            } catch (error) {
                logger.error(`Failed to load command ${file}:`, error);
            }
        }
    }
}

async function executeCommand({ sock, msg, sender, isGroup, command, args, user }) {
    const cmd = commands.get(command);
    if (!cmd) return;

    try {
        if (cmd.ownerOnly && !sender.includes(config.ownerNumber)) {
            return await sock.sendMessage(sender, { text: 'This command is only for the bot owner.' });
        }

        if (cmd.groupOnly && !isGroup) {
            return await sock.sendMessage(sender, { text: 'This command can only be used in groups.' });
        }

        await cmd.execute({ sock, msg, sender, isGroup, args, user });
    } catch (error) {
        logger.error(`Command execution error (${command}):`, error);
        await sock.sendMessage(sender, { text: 'An error occurred while executing the command.' });
    }
}

module.exports = { initializeCommands, executeCommand };
