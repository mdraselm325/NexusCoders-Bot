module.exports = {
    botName: process.env.BOT_NAME || 'NexusCoders',
    prefix: process.env.PREFIX || '!',
    ownerNumber: process.env.OWNER_NUMBER || '',
    mongoUri: process.env.MONGODB_URI || 'mongodb+srv://mateochatbot:xdtL2bYQ9eV3CeXM@gerald.r2hjy.mongodb.net/',
    commandCooldown: 3000,
    maxWarnings: 3,
    disabledCommands: [],
    blockedUsers: [],
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'],
    maxFileSize: 100 * 1024 * 1024
};
