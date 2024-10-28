module.exports = {
name: 'shell',
description: 'Execute a shell command',
usage: '!shell <command>',
category: 'admin',
aliases: ['sh', 'cmd'],
cooldown: 5,
adminOnly: true,
async execute(sock, message, args) {
const childProcess = require('child_process');
const command = args.join(' ');

if (!command) {
  return await sock.sendMessage(message.key.remoteJid, { text: 'Please provide a command to execute' });
}

childProcess.exec(command, (error, stdout, stderr) => {
  if (error) {
    return await sock.sendMessage(message.key.remoteJid, { text: `Error: ${error.message}` });
  }

  const response = `stdout:\n${stdout}\n\nstderr:\n${stderr}`;
  await sock.sendMessage(message.key.remoteJid, { text: response });
});

},
};