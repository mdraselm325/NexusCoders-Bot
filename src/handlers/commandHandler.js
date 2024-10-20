const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

let commands = new Map();

async function loadCommandsFromDirectory(directory) {
    try {
        const items = await fs.readdir(directory, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(directory, item.name);

            if (item.isDirectory()) {
                await loadCommandsFromDirectory(fullPath);
            } else if (item.name.endsWith('.js')) {
                try {
                    const command = require(fullPath);
                    if (command.name && command.execute) {
                        commands.set(command.name.toLowerCase(), command);
                        if (command.aliases) {
                            command.aliases.forEach(alias => 
                                commands.set(alias.toLowerCase(), command)
                            );
                        }
                        logger.info(`Loaded command: ${command.name}`);
                    }
                } catch (error) {
                    logger.error(`Error loading command ${item.name}:`, error);
                }
            }
        }
    } catch (error) {
        logger.error('Error loading commands:', error);
    }
}

async function initializeCommands() {
    commands.clear();
    const commandsPath = path.join(__dirname, '..', 'commands');
    await loadCommandsFromDirectory(commandsPath);
    logger.info(`Loaded ${commands.size} commands`);
}

async function executeCommand(commandName) {
    return commands.get(commandName);
}

function getAllCommands() {
    return Array.from(commands.values())
        .filter((cmd, index, self) => 
            index === self.findIndex(c => c.name === cmd.name)
        );
}

module.exports = {
    initializeCommands,
    executeCommand,
    getAllCommands
};
