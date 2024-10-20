const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');
const User = require('../models/user');

const commands = new Map();

async function loadCommand(commandPath) {
    try {
        const command = require(commandPath);
        if (command.name) {
            commands.set(command.name, command);
            logger.info(`Loaded command: ${command.name}`);
        }
    } catch (error) {
        logger.error(`Error loading command from ${commandPath}:`, error);
    }
}

async function loadCommandsFromDirectory(directory) {
    const items = await fs.readdir(directory);
    
    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
            await loadCommandsFromDirectory(fullPath);
        } else if (item.endsWith('.js')) {
            await loadCommand(fullPath);
        }
    }
}

async function initializeCommands() {
    const commandsDir = path.join(__dirname, '../commands');
    await loadCommandsFromDirectory(commandsDir);
    logger.info(`Loaded ${commands.size} commands`);
}

async function handleCommand(sock, msg, args, commandName) {
    const command = commands.get(commandName);
    if (!command) return;

    try {
        const sender = msg.key.remoteJid;
        let user = await User.findOne({ jid: sender });
        
        if (!user) {
            user = new User({ jid: sender });
            await user.save();
        }

        if (user.isBanned && !command.allowBanned) {
            await sock.sendMessage(sender, { text: "You are banned from using commands." });
            return;
        }

        if (command.ownerOnly && sender !== config.ownerNumber) {
            await sock.sendMessage(sender, { text: config.messages.permissionError });
            return;
        }

        const now = Date.now();
        const cooldown = command.cooldown || config.commandCooldown;
        const lastUsed = user.lastCommandUsed ? user.lastCommandUsed.getTime() : 0;
        
        if (now - lastUsed < cooldown * 1000) {
            await sock.sendMessage(sender, { text: config.messages.cooldownError });
            return;
        }

        await command.execute(sock, msg, args);
        user.lastCommandUsed = new Date();
        await user.save();

    } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);
        await sock.sendMessage(msg.key.remoteJid, { text: config.messages.error });
    }
}

module.exports = {
    initializeCommands,
    handleCommand,
    commands
};
