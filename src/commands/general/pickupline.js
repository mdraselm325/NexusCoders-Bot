const fetch = require('node-fetch'); // Ensure node-fetch is installed

module.exports = {
    name: 'pickup',  // Command name
    description: 'Get a random pickup line.',  // Command description
    usage: '!pickup',  // How to use the command
    category: 'fun',  // Command category
    aliases: ['pickupline'],  // Alternative command names
    cooldown: 5,  // Cooldown in seconds (optional)
    ownerOnly: false,  // Not restricted to bot owner
    adminOnly: false,  // Not restricted to group admins
    groupOnly: false,  // Can be used in groups and private chats
    privateOnly: false,  // Not restricted to private chats

    async execute(sock, message, args) {
        try {
            // Fetch a random pickup line from the API
            const response = await fetch('https://api-toxxictechinc.onrender.com/api/line?apikey=riasadmin');
            const data = await response.json();

            if (data && data.pickupline) {
                // Send the pickup line
                await sock.sendMessage(message.key.remoteJid, {
                    text: `*𝑯𝒆𝒓𝒆'𝒔 𝒂 𝑷𝒊𝒄𝒌𝒖𝒑 𝑳𝒊𝒏𝒆 𝒇𝒐𝒓 𝒚𝒐𝒖*\n${data.pickupline}\n\n> ❣️💟🌟❣️*`,
                    quoted: message
                });
            } else {
                // Handle if no pickup line is returned
                await sock.sendMessage(message.key.remoteJid, {
                    text: 'Sorry, I couldn’t fetch a pickup line right now.',
                    quoted: message
                });
            }
        } catch (error) {
            // Handle errors during the fetch request
            console.error(error);
            await sock.sendMessage(message.key.remoteJid, {
                text: 'An error occurred while fetching a pickup line.',
                quoted: message
            });
        }
    }
}
