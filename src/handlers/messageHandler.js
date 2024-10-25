const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const { isGroupMsg, isGroupAdmin, isOwner } = require('../utils/messages');
const logger = require('../utils/logger');

const commands = new Map();

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
                commands.set(command.name, command);
                if (command.aliases) {
                    command.aliases.forEach(alias => commands.set(alias, command));
                }
            }
        } catch (error) {
            logger.error(`Failed to load ${entry.name}:`, error);
        }
    }
};

const initializeCommands = async () => {
    const commandsDir = path.join(__dirname, '..', 'commands');
    await loadCommands(commandsDir);
    logger.info(`Loaded ${commands.size} commands`);
};

const executeCommand = async (sock, message, commandName, args, user) => {
    const cmd = commands.get(commandName);
    if (!cmd) return false;

    const jid = message.key.remoteJid;
    const isGroup = isGroupMsg(message);

    if (cmd.ownerOnly && !isOwner(user.jid)) {
        await sock.sendMessage(jid, { text: config.messages.commands.ownerOnly });
        return false;
    }

    if (cmd.premiumOnly && !user.isPremium && !isOwner(user.jid)) {
        await sock.sendMessage(jid, { text: config.messages.commands.premiumOnly });
        return false;
    }

    if (cmd.groupOnly && !isGroup) {
        await sock.sendMessage(jid, { text: config.messages.commands.groupOnly });
        return false;
    }

    if (cmd.privateOnly && isGroup) {
        await sock.sendMessage(jid, { text: config.messages.commands.privateOnly });
        return false;
    }

    if (cmd.adminOnly && !await isGroupAdmin(sock, jid, user.jid)) {
        await sock.sendMessage(jid, { text: config.messages.commands.adminOnly });
        return false;
    }

    if (cmd.minArgs && args.length < cmd.minArgs) {
        const usage = cmd.usage ? `\nUsage: ${config.bot.prefix}${cmd.name} ${cmd.usage}` : '';
        await sock.sendMessage(jid, { 
            text: `${config.messages.errors.notEnoughArgs}${usage}`
        });
        return false;
    }

    try {
        await cmd.execute(sock, message, args, user);
        return true;
    } catch (error) {
        logger.error(`Command execution error (${commandName}):`, error);
        await sock.sendMessage(jid, { 
            text: config.messages.commands.error 
        });
        return false;
    }
};

const getCommands = () => Array.from(commands.values());

module.exports = {
    initializeCommands,
    executeCommand,
    getCommands
};
