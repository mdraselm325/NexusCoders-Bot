module.exports = {
    botName: "NexusCoders Bot",
    version: "1.0.0",
    prefix: "!",
    owner: {
        name: "NexusCoders",
        number: "2347075663318",
    },
    support: {
        group: "https://chat.whatsapp.com/EoSi5ruqq1m6psIvKp9EQn",
        channel: "https://whatsapp.com/channel/0029VarItlZ8fewz4nyakm1u"
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
