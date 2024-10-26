module.exports = {
  name: 'help2',
  description: 'Displays all available commands on nexus or information about a specific command.',
  usage: '!help [command]',
  category: 'info',
  aliases: ['commands', 'h'],
  cooldown: 3,

  async execute(sock, message, args) {
    const commands = Object.values(require('./commands/index'));

    if (args.length === 0) {
      const commandList = commands.map(cmd => `!${cmd.name} - ${cmd.description}`).join('\n');
      await sock.sendMessage(message.key.remoteJid, { text: `Available Commands:\n\n${commandList}`, quoted: message });
    } else {
      const targetCmd = commands.find(cmd => cmd.name === args[0] || cmd.aliases.includes(args[0]));
      if (!targetCmd) return await sock.sendMessage(message.key.remoteJid, { text: `Command ${args[0]} not found.`, quoted: message });
      
      await sock.sendMessage(message.key.remoteJid, { text: `!${targetCmd.name} - ${targetCmd.description}\nUsage: ${targetCmd.usage}`, quoted: message });
    }
  }
};