const { isCommand, parseCommand, isGroupMsg, getMessageText, isOwner } = require('../utils/messages');
const { executeCommand } = require('./commandHandler');
const User = require('../models/user');
const config = require('../config');

const cooldowns = new Map();
const spamMap = new Map();

async function handleAntiSpam(sock, message, userId) {
    if (!config.features.antiSpam.enabled) return false;
    
    const now = Date.now();
    const userData = spamMap.get(userId) || { count: 0, firstMsg: now };
    
    if (now - userData.firstMsg > config.features.antiSpam.interval) {
        userData.count = 0;
        userData.firstMsg = now;
    }

    userData.count++;
    spamMap.set(userId, userData);

    if (userData.count > config.features.antiSpam.maxMessages) {
        await sock.sendMessage(message.key.remoteJid, { 
            text: config.features.autoResponse.messages.spam 
        });
        return true;
    }
    return false;
}

async function handlePresence(sock, message) {
    if (!message.key.remoteJid) return;

    if (config.features.presence.autoTyping) {
        await sock.sendPresenceUpdate('composing', message.key.remoteJid);
    }

    if (config.features.presence.autoRead) {
        await sock.readMessages([message.key]);
    }

    if (config.features.presence.autoOnline) {
        await sock.sendPresenceUpdate('available', message.key.remoteJid);
    }
}

async function handleUser(message) {
    const userId = message.key.participant || message.key.remoteJid;
    let user = await User.findOne({ jid: userId });

    if (!user) {
        user = new User({
            jid: userId,
            name: message.pushName || "User",
            isAdmin: config.bot.ownerNumber.includes(userId)
        });
    }

    user.statistics.messagesReceived++;
    await user.save();
    return user;
}

async function messageHandler(sock, message) {
    try {
        if (!message?.message) return;

        const user = await handleUser(message);
        if (user.isBanned && !isOwner(user.jid)) return;

        const jid = message.key.remoteJid;
        const userId = message.key.participant || message.key.remoteJid;
        const messageText = getMessageText(message);

        await handlePresence(sock, message);
        
        if (await handleAntiSpam(sock, message, userId)) return;

        if (isCommand(messageText)) {
            const { command, args } = parseCommand(messageText);
            
            const cmdCooldown = cooldowns.get(`${userId}-${command}`) || 0;
            if (Date.now() < cmdCooldown) {
                const timeLeft = Math.ceil((cmdCooldown - Date.now()) / 1000);
                await sock.sendMessage(jid, {
                    text: `Please wait ${timeLeft} seconds before using this command again.`
                });
                return;
            }

            if (config.security.bannedCommands.includes(command)) {
                await sock.sendMessage(jid, {
                    text: config.messages.commands.disabled
                });
                return;
            }

            if (config.security.maintenanceMode && !isOwner(userId)) {
                await sock.sendMessage(jid, {
                    text: config.messages.commands.maintenance
                });
                return;
            }

            const result = await executeCommand(sock, message, command, args, user);
            if (result) {
                user.statistics.commandsUsed++;
                await user.save();

                cooldowns.set(`${userId}-${command}`, Date.now() + config.limits.cooldown);
            }
        }

        if (config.features.leveling.enabled) {
            const expGained = config.features.leveling.messageXP;
            const levelUp = await user.addExperience(expGained);

            if (levelUp) {
                await sock.sendMessage(jid, {
                    text: `🎉 Congratulations ${user.name}! You've reached level ${user.level}!`
                });
            }
        }

    } catch (error) {
        console.error('Message handling error:', error);
        throw error;
    }
}

module.exports = messageHandler;
