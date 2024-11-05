const axios = require('axios');
const { MessageType } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'truthordare',
  aliases: ['tod'],
  category: 'fun',
  description: 'Play Truth or Dare',
  usage: 'truthordare',
  cooldown: 5,

  async execute(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');

    try {
      const response = await axios.get('https://api.truthordarebot.xyz/v1/truth');
      const { question, type } = response.data;

      await sock.sendMessage(chatId, {
        text: `Truth or Dare: ${type}\n\n${question}`,
      }, { quoted: message });
    } catch (error) {
      console.error(error);
      await sock.sendMessage(chatId, {
        text: 'Failed to fetch Truth or Dare question',
      }, { quoted: message });
    }
  },
};