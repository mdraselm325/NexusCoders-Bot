module.exports = {
    botName: "NexusCoders Bot",
    prefix: "!",
    ownerNumber: "2347075663318@s.whatsapp.net", // Replace with your number
    supportGroup: "group-id@g.us", // Replace with your group ID
    
    // Database configuration
    mongoUri: process.env.MONGO_URI || "mongodb+srv://arisonbeckham:arisonbeckham@nexuscoders.yxxbj.mongodb.net/?retryWrites=true&w=majority&appName=NexusCoders",
    
    // Command settings
    commandCooldown: 3, // seconds
    
    // Bot settings
    autoRead: true,
    autoTyping: true,
    autoRecording: false,
    
    // Response messages
    messages: {
        permissionError: "⚠️ You don't have permission to use this command!",
        cooldownError: "⏳ Please wait before using this command again.",
        error: "❌ An error occurred while executing this command.",
        success: "✅ Command executed successfully!"
    },
    
    // Feature flags
    features: {
        antiSpam: true,
        antiLink: true,
        autoMute: false,
        welcomeMessage: true
    }
};
