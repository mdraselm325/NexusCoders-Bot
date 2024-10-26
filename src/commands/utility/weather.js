module.exports = {
    name: 'weather',
    description: 'Get weather information',
    usage: '!weather <city>',
    category: 'utility',
    async execute(sock, message, args) {
        if (!args.length) return await sock.sendMessage(message.key.remoteJid, { text: 'Please provide a city name' });
        
        const city = args.join(' ');
        const apiKey = config.apis.weatherApi;
        
        try {
            const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
            const data = await response.json();
            
            const weather = `📍 Weather in ${data.name}:
🌡️ Temperature: ${data.main.temp}°C
💨 Wind: ${data.wind.speed} m/s
💧 Humidity: ${data.main.humidity}%
☁️ Conditions: ${data.weather[0].description}`;
            
            await sock.sendMessage(message.key.remoteJid, { text: weather });
        } catch (error) {
            await sock.sendMessage(message.key.remoteJid, { text: 'Error fetching weather data' });
        }
    }
};
