
const axios = require('axios');

module.exports = {
    name: 'weather',
    description: 'Get current weather information for a city',
    usage: '!weather <city>',
    category: 'Information',
    cooldown: 5,
    aliases: ['wthr', 'forecast'],
    async execute(sock, message, args) {
        if (!args.length) {
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Please provide a city name.',
                quoted: message 
            });
            return;
        }

        const city = args.join(' ');
        const thinking = await sock.sendMessage(message.key.remoteJid, { 
            text: '🌦️ Checking the weather...',
            quoted: message 
        });

        try {
            const response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=dd9ee83c34de4fc295d162848242610&q=${city}`);
            const { temp_c, condition } = response.data.current;
            const weatherInfo = `🌤️ *Weather in ${city}:*\nTemperature: ${temp_c}°C\nCondition: ${condition.text}`;

            await sock.sendMessage(message.key.remoteJid, {
                text: weatherInfo,
                edit: thinking.key
            });
        } catch (error) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ Could not retrieve weather data. Check the city name or try again later.',
                edit: thinking.key
            });
        }
    }
};
