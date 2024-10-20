const startupMessage = `
╔══════════════════════════╗
║     BOT STARTUP INFO     ║
╚══════════════════════════╝

▸ Status: Online
▸ Time: ${new Date().toLocaleString()}
▸ Mode: Development
▸ Version: 1.0.0

╔══════════════════════════╗
║      SYSTEM STATUS       ║
╚══════════════════════════╝

▸ Platform: ${process.platform}
▸ Node Version: ${process.version}
▸ Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
▸ CPU Usage: ${process.cpuUsage().user}
`;

const groupEvents = {
    welcome: (username) => `Welcome ${username} to our group! 🎉`,
    goodbye: (username) => `Goodbye ${username}! 👋`,
    promote: (username) => `${username} has been promoted to admin! 🎊`,
    demote: (username) => `${username} has been demoted from admin! 📉`
};

const errorMessages = {
    commandNotFound: "❌ Command not found! Use !help to see available commands.",
    invalidArgs: "❌ Invalid arguments! Check !help for proper usage.",
    noPermission: "❌ You don't have permission to use this command!",
    cooldown: "⏳ Please wait before using this command again.",
    error: "❌ An error occurred while executing this command."
};

const successMessages = {
    commandSuccess: "✅ Command executed successfully!",
    settingsUpdated: "✅ Settings updated successfully!",
    userBanned: "✅ User has been banned successfully!",
    userUnbanned: "✅ User has been unbanned successfully!"
};

module.exports = {
    startupMessage,
    groupEvents,
    errorMessages,
    successMessages
};
