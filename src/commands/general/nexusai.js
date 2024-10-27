const axios = require('axios');

module.exports = {
    name: 'nexusai',
    description: 'Chat with AI using Nexus',
    usage: '!nexusai <message>',
    category: 'AI',
    cooldown: 5,
    aliases: ['nexusask', 'nexusbot'],
    async execute(sock, message, args) {
        if (!args.length) {
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Please provide a question or message for the AI',
                quoted: message 
            });
            return;
        }

        const thinking = await sock.sendMessage(message.key.remoteJid, { 
            text: '🤖 Thinking...',
            quoted: message 
        });

        try {
            const prompt = args.join(' ');
            const encodedPrompt = encodeURIComponent(prompt);
            const response = await axios.get(`https://api-toxxictechinc.onrender.com/api/chat?question=${encodedPrompt}&apikey=nexusteam`);

            if (response.data && response.data.data && response.data.data.response) {
                const aiResponse = `🤖 *Nexus AI Response:*\n\n${response.data.data.response}`;

                await sock.sendMessage(message.key.remoteJid, {
                    text: aiResponse,
                    edit: thinking.key
                });
            } else {
                throw new Error('Invalid response from Nexus AI');
            }
        } catch (error) {
            await sock.sendMessage(message.key.remoteJid, {
                text: '❌ An error occurred while processing your request. Please try again later.',
                edit: thinking.key
            });
        }
    }
                }
