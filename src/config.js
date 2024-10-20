module.exports = {
    botName: "NexusCoders Bot",
    version: "1.0.0",
    prefix: "!",
    owner: {
        name: "NexusCoders",
        number: "your_number@s.whatsapp.net",
    },
    support: {
        group: "https://chat.whatsapp.com/your_group",
        channel: "https://t.me/your_channel"
    },
    database: {
        uri: process.env.DB_URI || "mongodb+srv://arisonbeckham:arisonbeckham@nexuscoders.yxxbj.mongodb.net/?retryWrites=true&w=majority&appName=NexusCoders"
    },
    cooldowns: {
        default: 3,
        commands: {
            broadcast: 300,
            ban: 10,
            unban: 10
        }
    },
    limits: {
        maxCommandsPerMinute: 20,
        maxMessagesPerMinute: 60
    },
    permissions: {
        admin: ["admin", "owner"],
        owner: ["owner"]
    }
};
