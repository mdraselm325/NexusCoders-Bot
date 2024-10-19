const os = require('os');
const config = require('../config');

async function startupMessage() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus().length;

    return `
🤖 *${config.botName} Started*

🖥️ *System Info*
Platform: ${platform}
Architecture: ${arch}
CPUs: ${cpus}
Memory Used: ${Math.round(memory.heapUsed / 1024 / 1024)}MB
Uptime: ${Math.floor(uptime)} seconds

⚙️ *Bot Configuration*
Prefix: ${config.prefix}
Owner: ${config.ownerNumber}
`;
}

module.exports = { startupMessage };
