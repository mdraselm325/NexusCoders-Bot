module.exports = {
    name: 'info',
    description: 'play song',
    usage: '!play',
    category: 'general',

    async execute(args, sock, msg, message) {





const yts = require("yt-search");
try {



let search = await yts(args);
        let link = search.all[0].url;

        let response = await fetch(`https://api.dreaded.site/api/ytdl/video?url=${link}`)

let data = await response.json()


await sock.sendMessage(msg.key.remoteJid, {
 document: {url: data.result.downloadLink},
mimetype: "audio/mp3",
 fileName: `${search.all[0].title}.mp3` });


} catch (error) {

console.log("Download failed\n" + error)

}

}

}