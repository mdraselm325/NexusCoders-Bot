const fs = require('fs');
const path = './Gallery/database/antilink.json';

// Load or initialize the antilink list
let ntilinkall = JSON.parse(fs.readFileSync(path, 'utf-8'));

module.exports = {
    name: 'antilink',
    description: 'Toggle antilink feature to kick users who send links in the group',
    usage: '!antilink <on/off>',
    category: 'Moderation',
    cooldown: 5,
    async execute(sock, message, args) {
        const from = message.key.remoteJid;

        // Check if the command is used in a group
        if (!message.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' });

        // Check if user is admin or creator
        if (!isAdmins && !isCreator) return sock.sendMessage(from, { text: '❌ Only group admins can use this command.' });

        // Check if bot is admin
        if (!isBotAdmins) return sock.sendMessage(from, { text: '❌ I need to be an admin to kick users.' });

        // Turn on antilink
        if (args[0] === 'on') {
            if (ntilinkall.includes(from)) return sock.sendMessage(from, { text: '*Already activated*' });

            ntilinkall.push(from);
            fs.writeFileSync(path, JSON.stringify(ntilinkall));

            sock.sendMessage(from, { text: '*Anti_Link successfully set to kick link senders!*' });

            const group = await sock.groupMetadata(from);
            const members = group.participants.map(member => member.id.replace('c.us', 's.whatsapp.net'));
        
        // Turn off antilink
        } else if (args[0] === 'off') {
            if (!ntilinkall.includes(from)) return sock.sendMessage(from, { text: '*Already deactivated*' });

            ntilinkall = ntilinkall.filter(groupId => groupId !== from);
            fs.writeFileSync(path, JSON.stringify(ntilinkall));

            sock.sendMessage(from, { text: '*Antilink successfully deactivated.*' });

        // Invalid argument
        } else {
            await sock.sendMessage(from, { 
                text: `Please type the option\n\nExample: ${prefix + command} on\nExample: ${prefix + command} off\n\non to enable\noff to disable`
            });
        }
    }
};
