const config = require('../../config');
const { getCommands } = require('../../handlers/commandHandler');

module.exports = {
    name: 'menu2',
    description: 'Display all available commands',
    usage: '!menu [category]',
    category: 'general',
    async execute(sock, message, args) {
        const commands = getCommands();
        const categories = [...new Set(commands.map(cmd => cmd.category))];
        const requestedCategory = args[0]?.toLowerCase();

        let response = `╭───────────❍\n│❏ ${config.bot.name} - 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗠𝗲𝗻𝘂\n`;
        response += `│❏ 𝗣𝗿𝗲𝗳𝗶𝘅: ${config.bot.prefix}\n├───────────❍\n`;

        if (requestedCategory && categories.includes(requestedCategory)) {
            const categoryCommands = commands.filter(cmd => cmd.category === requestedCategory);
            response += `├〘 ${requestedCategory.toUpperCase()} Commands 〙\n\n`;
            categoryCommands.forEach(cmd => {
                response += `│• ➤ ${config.bot.prefix}${cmd.name} - ${cmd.description}\n`;
                if (cmd.usage) response += `│➤ 𝗨𝘀𝗮𝗴𝗲: ${cmd.usage}\n`;
                response += `╰────────────❍`;
            });
        } else {
            categories.forEach(category => {
                const categoryCommands = commands.filter(cmd => cmd.category === category);
                response += `├〘 ${category.toUpperCase()} 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 〙\n`;
                categoryCommands.forEach(cmd => {
                    response += `├•➤ ${config.bot.prefix}${cmd.name}\n`;
                });
                response += '\n';
            });
            response += `𝗧𝘆𝗽𝗲 ${config.bot.prefix}𝗺𝗲𝗻𝘂 [𝗰𝗮𝘁𝗲𝗴𝗼𝗿𝘆] 𝗳𝗼𝗿 𝗮 𝗱𝗲𝘁𝗮𝗶𝗹𝗲𝗱 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻 𝗮𝗯𝗼𝘂𝘁 𝗮 𝘀𝗽𝗲𝗰𝗶𝗳𝗶𝗰 𝗰𝗼𝗺𝗺𝗮𝗻𝗱..`;
        }

        await sock.sendMessage(message.key.remoteJid, {
            image: { url: 'https://tiny.one/bdvr9s9e' },
            caption: response,
            detectLinks: true
        });
    }
};