const config = require('../config');
const logger = require('../utils/logger');
const { getUser, updateUser } = require('../models/user');
const { initializeCommands, executeCommand } = require('./commandHandler');
const messages = require('../utils/messages');

const userCooldowns = new Map();
const userMessageCounts = new Map();

function resetMessageCount() {
    userMessageCounts.clear();
}

setInterval(resetMessageCount, 60000);

async function messageHandler(sock, msg) {
    try {
        if (!msg.message || msg.key.fromMe) return;

        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const messageContent = msg.message.conversation || 
                             msg.message.extendedTextMessage?.text || 
                             msg.message.imageMessage?.caption || 
                             msg.message.videoMessage?.caption;

        if (!messageContent) return;

        // Rate limiting
        const userMessageCount = userMessageCounts.get(sender) || 0;
        if (userMessageCount >= config.limits.maxMessagesPerMinute) {
            await sock.sendMessage(chatId, { text: "⚠️ You're sending messages too fast. Please slow down." });
            return;
        }
        userMessageCounts.set(sender, userMessageCount + 1);

        // Check if message starts with prefix
        if (!messageContent.startsWith(config.prefix)) return;

        // Get user from database
        const user = await getUser(sender);
        if (user.banned) {
            await sock.sendMessage(chatId, { text: messages.banned });
            return;
        }

        // Parse command and arguments
        const [commandName, ...args] = messageContent.slice(config.prefix.length).trim().split(/\s+/);
        if (!commandName) return;

        // Get command
        const command = await executeCommand(commandName.toLowerCase());
        if (!command) return;

        // Check permissions
        if (command.permission) {
            const isAdmin = msg.key.participant ? 
                (await sock.groupMetadata(chatId)).participants
                    .find(p => p.id === sender)?.admin : false;
            const isOwner = sender === config.owner.number;

            if (command.permission === 'admin' && !isAdmin && !isOwner) {
                await sock.sendMessage(chatId, { text: messages.adminOnly });
                return;
            }
            if (command.permission === 'owner' && !isOwner) {
                await sock.sendMessage(chatId, { text: messages.ownerOnly });
                return;
            }
        }

        // Check cooldown
        const cooldownTime = config.cooldowns.commands[command.name] || config.cooldowns.default;
        const userCooldown = userCooldowns.get(`${sender}-${command.name}`) || 0;
        const now = Date.now();

        if (now < userCooldown) {
            const timeLeft = Math.ceil((userCooldown - now) / 1000);
            await sock.sendMessage(chatId, { text: messages.cooldown(timeLeft) });
            return;
        }

        // Execute command
        await command.execute({
            sock,
            msg,
            args,
            user,
            chatId,
            sender
        });

        // Set cooldown
        userCooldowns.set(`${sender}-${command.name}`, now + (cooldownTime * 1000));
        
        // Update user stats
        await updateUser(sender, { $inc: { commandsUsed: 1 } });

    } catch (error) {
        logger.error('Message handling error:', error);
        await sock.sendMessage(msg.key.remoteJid, { text: messages.error });
    }
}

module.exports = messageHandler;
