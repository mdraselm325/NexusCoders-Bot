const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const childProcess = require('child_process');
const fs = require('fs');

module.exports = {
  name: 'sing',
  description: 'Play or download music from YouTube',
  usage: '!play <song name>',
  category: 'music',
  aliases: ['s'],
  cooldown: 5,
  adminOnly: false,
  async execute(sock, message, args) {
    const songName = args.join(' ');
    
    if (!songName) {
      return await sock.sendMessage(message.key.remoteJid, { text: 'Please provide a song name' });
    }
    
    const searchResult = await ytsr(songName, { limit: 10 });
    
    const buttons = searchResult.items.map((item, index) => {
      return {
        buttonId: `sing_${index}`,
        buttonText: { displayText: item.title },
        type: 1,
      };
    });
    
    const buttonMessage = {
      text: 'Select a song',
      footer: 'Powered by Nexus',
      buttons: buttons,
    };
    
    await sock.sendMessage(message.key.remoteJid, buttonMessage, { quoted: message });
    
    sock.on('buttonsResponseMessage', async (buttonResponse) => {
      if (buttonResponse.buttonId.startsWith('play_')) {
        const index = buttonResponse.buttonId.split('_')[1];
        const selectedSong = searchResult.items[index];
        const videoId = selectedSong.id;
        
        const downloadButtons = [
          {
            buttonId: `download_audio_${videoId}`,
            buttonText: { displayText: 'Download Audio' },
            type: 1,
          },
          {
            buttonId: `download_video_${videoId}`,
            buttonText: { displayText: 'Download Video' },
            type: 1,
          },
        ];
        
        const downloadButtonMessage = {
          text: 'Select download option',
          footer: 'Powered by Nexus',
          buttons: downloadButtons,
        };
        
        await sock.sendMessage(buttonResponse.chatId, downloadButtonMessage, { quoted: buttonResponse });
        
        sock.on('buttonsResponseMessage', async (downloadButtonResponse) => {
          if (downloadButtonResponse.buttonId.startsWith('download_audio_')) {
            const videoId = downloadButtonResponse.buttonId.split('_')[2];
            const command = `yt-dlp -x --audio-format mp3 https://www.youtube.com/watch?v=${videoId}`;
            
            childProcess.exec(command, (error, stdout, stderr) => {
              if (error) {
                return await sock.sendMessage(downloadButtonResponse.chatId, { text: `Error: ${error.message}` });
              }
              
              const filename = stdout.split(' ').pop();
              const fileSize = fs.statSync(filename).size;
              
              if (fileSize < 10000000) { // it's like 10mbs oky bro
                await sock.sendMessage(downloadButtonResponse.chatId,
//Frank kaumba coder Nexus 