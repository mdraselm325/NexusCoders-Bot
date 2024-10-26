const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

let commands = new Map();

const loadCommands = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
            await loadCommands(fullPath);
            continue;
        }
        
        if (!entry.name.endsWith('.js')) continue;
        
        try {
            const command = require(fullPath);
            if (command.name && command.execute) {
                command.category = path.basename(path.dirname(fullPath));
                commands.set(command.name, command);
            }
        } catch (error) {
            logger.error(`Failed to load command ${entry.name}:`, error);
        }
    }
};

const initializeCommands = async () => {
    const commandsDir = path.join(__dirname, '..', 'commands');
    await loadCommands(commandsDir);
    logger.info(`Loaded ${commands.size} commands`);
};

const isGroupAdmin = async (sock, groupId, participant) => {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const groupAdmins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);
        return groupAdmins.includes(participant);
    } catch {
        return false;
    }
};

const executeCommand = async (sock, message, command, args) => {
    const cmd = commands.get(command);
    if (!cmd) return;

    if (cmd.ownerOnly && !message.key.fromMe) {
        await sock.sendMessage(message.key.remoteJid, { text: "This command is only for bot owner!" });
        return;
    }

    if (cmd.adminOnly && !await isGroupAdmin(sock, message.key.remoteJid, message.key.participant)) {
        await sock.sendMessage(message.key.remoteJid, { text: "This command is only for group admins!" });
        return;
    }

    try {
        await cmd.execute(sock, message, args);
    } catch (error) {
        logger.error(`Command execution error (${command}):`, error);
        await sock.sendMessage(message.key.remoteJid, { text: "An error occurred while executing the command." });
    }
};

const getCommands = () => {
    return Array.from(commands.values());
};

module.exports = {
    initializeCommands,
    executeCommand,
    getCommands
};
