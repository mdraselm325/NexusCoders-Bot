const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');

module.exports = {
    name: 'sticker',
    description: 'Convert image/video to sticker',
    async execute({ sock, msg, sender }) {
        const quoted = msg.message.imageMessage || msg.message.videoMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

        if (!quoted) {
            await sock.sendMessage(sender, { text: 'Send/reply to an image/video' });
            return;
        }

        const buffer = await sock.downloadMediaMessage(msg);
        const tempFile = path.join(process.cwd(), 'temp', `${Date.now()}.webp`);

        if (quoted.seconds > 10) {
            await sock.sendMessage(sender, { text: 'Video must be less than 10 seconds' });
            return;
        }

        try {
            await fs.writeFile(tempFile + '.input', buffer);
            
            await new Promise((resolve, reject) => {
                const ffmpeg = exec(
                    `ffmpeg -i ${tempFile}.input -vf scale=512:512 -t 10 -r 10 -f webp -compression_level 6 ${tempFile}`,
                    async (error) => {
                        await fs.unlink(tempFile + '.input');
                        if (error) reject(error);
                        else resolve();
                    }
                );
            });

            await sock.sendMessage(sender, { 
                sticker: { url: tempFile }
            });
            
            await fs.unlink(tempFile);
        } catch (error) {
            await sock.sendMessage(sender, { text: 'Failed to create sticker' });
        }
    }
};
