const { parseCommand, isCommand, isGroupMsg, downloadMedia } = require('../utils/messages');
const { executeCommand } = require('./commandHandler');
const User = require('../models/user');
const config = require('../config');

const cooldowns = new Map();
const spamMap = new Map();

const handleAntiSpam = async (sock, message, userId) => {
    if (!config.antiSpam) return false;
    
    const now = Date.now();
    const userData = spamMap.get(userId) || { count: 0, firstMsg: now };
    
    if (now - userData.firstMsg > 10000) {
        userData.count = 0;
        userData.firstMsg = now;
    }
    
    userData.count++;
    spamMap.set(userId, userData);
    
    if (userData.count > 7) {
        await sock.sendMessage(message.key.remoteJid, { text: "⚠️ Please avoid spamming!" });
        return true;
    }
    return false;
};

const handleAntiLink = async (sock, message) => {
    if (!config.antiLink || !isGroupMsg(message)) return false;
    
    const content = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    if (/(https?:\/\/[^\s]+)/.test(content)) {
        const isAdmin = await isGroupAdmin(sock, message.key.remoteJid, message.key.participant);
        if (!isAdmin) {
            await sock.sendMessage(message.key.remoteJid, { text: "⚠️ Links are not allowed in this group!" });
            await sock.groupParticipantsUpdate(message.key.remoteJid, [message.key.participant], "remove");
            return true;
        }
    }
    return false;
};

const handlePresence = async (sock, jid, presence) => {
    if (config.autoRead) {
        await sock.sendPresenceUpdate(presence, jid);
        await sock.readMessages([jid]);
    }
};

const handleUser = async (message) => {
    const userId = message.key.participant || message.key.remoteJid;
    let user = await User.findOne({ jid: userId });
    
    if (!user) {
        const pushName = message.pushName || "User";
        user = new User({
            jid: userId,
            name: pushName
        });
        await user.save();
    }
    
    user.statistics.messagesReceived++;
    await user.save();
    return user;
};

const messageHandler = async (sock, message) => {
    try {
        if (!message.message) return;

        const user = await handleUser(message);
        if (user.isBanned) return;

        const jid = message.key.remoteJid;
        const userId = message.key.participant || message.key.remoteJid;
        const content = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

        if (await handleAntiSpam(sock, message, userId)) return;
        if (await handleAntiLink(sock, message)) return;

        if (config.autoTyping) {
            await handlePresence(sock, jid, "composing");
        }

        if (config.autoRecording && message.message?.audioMessage) {
            await handlePresence(sock, jid, "recording");
        }

        if (isCommand(content)) {
            const { command, args } = parseCommand(content);
            
            if (!command) {
                await sock.sendMessage(jid, {
                    text: `❌ Unknown command. Type ${config.prefix}help to see available commands.`
                });
                return;
            }

            const cmdCooldown = cooldowns.get(`${userId}-${command}`) || 0;
            if (Date.now() < cmdCooldown) {
                const timeLeft = Math.ceil((cmdCooldown - Date.now()) / 1000);
                await sock.sendMessage(jid, {
                    text: `⏳ Please wait ${timeLeft} seconds before using this command again.`
                });
                return;
            }

            if (config.disabledCommands.includes(command)) {
                await sock.sendMessage(jid, {
                    text: "❌ This command is currently disabled."
                });
                return;
            }

            if (isGroupMsg(message) && config.enabledGroups.length > 0) {
                if (!config.enabledGroups.includes(jid)) {
                    await sock.sendMessage(jid, {
                        text: "❌ Bot commands are not enabled in this group."
                    });
                    return;
                }
            }

            await executeCommand(sock, message, command, args);
            user.statistics.commandsUsed++;
            await user.save();

            const cooldownTime = 3000;
            cooldowns.set(`${userId}-${command}`, Date.now() + cooldownTime);
            
            if (config.deleteCommandMessages) {
                setTimeout(async () => {
                    await sock.sendMessage(jid, { delete: message.key });
                }, 5000);
            }
        }

        if (config.levelingSystem) {
            const expGained = config.experiencePoints.messageExp;
            const levelUp = await user.addExperience(expGained);
            
            if (levelUp) {
                await sock.sendMessage(jid, {
                    text: `🎉 Congratulations ${user.name}! You've reached level ${user.level}!`
                });
            }
        }

    } catch (error) {
        console.error('Message handling error:', error);
    }
};

module.exports = messageHandler;
