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

const getMessageType = (message) => {
    const { mtype } = message;
    if (mtype === 'imageMessage') return 'image';
    if (mtype === 'videoMessage') return 'video';
    if (mtype === 'audioMessage') return 'audio';
    if (mtype === 'stickerMessage') return 'sticker';
    if (mtype === 'documentMessage') return 'document';
    return 'text';
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
    return text.startsWith(config.prefix);
};

const parseCommand = (text) => {
    if (!isCommand(text)) return null;
    const args = text.slice(config.prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();
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
    const type = getMessageType(message);
    return ['image', 'video', 'audio', 'sticker', 'document'].includes(type);
};

const getGroupAdmins = async (sock, groupId) => {
    const participants = await sock.groupMetadata(groupId);
    return participants.filter(p => p.admin).map(p => p.id);
};

const isGroupAdmin = async (sock, groupId, userId) => {
    const admins = await getGroupAdmins(sock, groupId);
    return admins.includes(userId);
};

module.exports = {
    extractMessageContent,
    getMessageType,
    downloadMedia,
    parseMessageArgs,
    isCommand,
    parseCommand,
    getMentions,
    isGroupMsg,
    getQuotedMessage,
    isMediaMessage,
    getGroupAdmins,
    isGroupAdmin
};
