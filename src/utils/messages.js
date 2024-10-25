const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');

const extractMessageContent = (message) => {
    if (!message) return null;
    const messageTypes = [
        'conversation', 'imageMessage', 'videoMessage', 'extendedTextMessage',
        'audioMessage', 'stickerMessage', 'documentMessage', 'contactMessage',
        'locationMessage'
    ];
    
    for (const type of messageTypes) {
        if (message[type]) return { type, content: message[type] };
    }
    return null;
};

const getMessageText = (message) => {
    const msg = message.message;
    if (!msg) return '';
    return msg.conversation || msg.extendedTextMessage?.text || 
           msg.imageMessage?.caption || msg.videoMessage?.caption || '';
};

const downloadMedia = async (message) => {
    try {
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        return buffer;
    } catch (error) {
        throw new Error('Failed to download media');
    }
};

const parseMessageArgs = (text) => {
    if (!text) return [];
    return text.split(' ').filter(arg => arg.length > 0);
};

const isCommand = (text) => {
    if (!text) return false;
    return text.startsWith(config.bot.prefix);
};

const parseCommand = (text) => {
    if (!isCommand(text)) return { command: '', args: [] };
    const args = text.slice(config.bot.prefix.length).trim().split(' ');
    const command = args.shift()?.toLowerCase();
    return { command, args };
};

const getMentions = (message) => {
    const mentions = [];
    if (message.mentionedJid) mentions.push(...message.mentionedJid);
    return mentions;
};

const isGroupMsg = (message) => {
    return message.key.remoteJid.endsWith('@g.us');
};

const getQuotedMessage = async (message) => {
    if (!message.quoted) return null;
    return message.quoted;
};

const isMediaMessage = (message) => {
    const msg = message.message;
    return !!(msg?.imageMessage || msg?.videoMessage || msg?.audioMessage || 
              msg?.stickerMessage || msg?.documentMessage);
};

const getGroupAdmins = async (sock, groupId) => {
    try {
        const metadata = await sock.groupMetadata(groupId);
        return metadata.participants
            .filter(p => p.admin)
            .map(p => p.id);
    } catch {
        return [];
    }
};

const isGroupAdmin = async (sock, groupId, userId) => {
    const admins = await getGroupAdmins(sock, groupId);
    return admins.includes(userId);
};

const isOwner = (userId) => {
    return config.bot.ownerNumber.includes(userId);
};

module.exports = {
    extractMessageContent,
    getMessageText,
    downloadMedia,
    parseMessageArgs,
    isCommand,
    parseCommand,
    getMentions,
    isGroupMsg,
    getQuotedMessage,
    isMediaMessage,
    getGroupAdmins,
    isGroupAdmin,
    isOwner
};
