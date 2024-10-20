require('dotenv').config();
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
} = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const NodeCache = require('node-cache');
const gradient = require('gradient-string');
const figlet = require('figlet');
const { connectToDatabase } = require('./src/utils/database');
const logger = require('./src/utils/logger.js');
const messageHandler = require('./src/handlers/messageHandler');
const config = require('./src/config');
const { initializeCommands } = require('./src/handlers/commandHandler');
const { startupMessage } = require('./src/utils/messages');

const msgRetryCounterCache = new NodeCache({
    stdTTL: 3600,
    checkperiod: 600,
    maxKeys: 500
});

const store = makeInMemoryStore({
    logger: P({ level: 'silent' })
});

store.readFromFile('./baileys_store.json');
setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10_000);

const app = express();
let sock = null;
let initialConnection = true;
let reconnectAttempts = 0;
let isConnected = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 3000;
const sessionDir = path.join(process.cwd(), 'session');

const browserConfig = {
    browser: ['Chrome (Linux)', '', ''],
    headerHost: 'web.whatsapp.com',
    webVersion: '2.2326.49',
    platform: 'Linux',
    browserName: 'Chrome',
    sourceUrl: 'https://web.whatsapp.com/',
    webSocketUrl: 'wss://web.whatsapp.com/ws/chat',
};

async function displayBanner() {
    return new Promise((resolve) => {
        figlet(config.botName, (err, data) => {
            if (!err) console.log(gradient.rainbow(data));
            resolve();
        });
    });
}

async function ensureDirectories() {
    const dirs = [sessionDir, 'temp', 'assets', 'logs', 'downloads'];
    await Promise.all(dirs.map(dir => fs.ensureDir(dir)));
}

async function cleanTempFiles() {
    try {
        await fs.emptyDir('temp');
        await fs.emptyDir('downloads');
        logger.info('Temporary files cleaned');
    } catch (error) {
        logger.error('Error cleaning temp files:', error);
    }
}

async function loadSessionData() {
    if (!process.env.SESSION_DATA) {
        logger.error('SESSION_DATA environment variable is required');
        return false;
    }

    try {
        const sessionData = Buffer.from(process.env.SESSION_DATA, 'base64').toString();
        const parsedData = JSON.parse(sessionData);
        await fs.writeJson(path.join(sessionDir, 'creds.json'), parsedData);
        return true;
    } catch (error) {
        logger.error('Session data error:', error);
        return false;
    }
}

async function sendKeepAlive() {
    if (sock && isConnected) {
        try {
            await sock.sendPresenceUpdate('available');
        } catch (error) {
            logger.error('Keep-alive error:', error);
        }
    }
}

function setupKeepAlive() {
    setInterval(sendKeepAlive, 60000);
}

async function handleIncomingMessage(msg) {
    if (!msg.key.fromMe) {
        try {
            await messageHandler(sock, msg);
        } catch (error) {
            logger.error('Message handling error:', error);
            if (msg.key.remoteJid) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: "Sorry, I encountered an error processing your message."
                }).catch(logger.error);
            }
        }
    }
}

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const socketConfig = {
            version,
            auth: state,
            printQRInTerminal: true,
            logger: P({ level: 'silent' }),
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 120000,
            connectTimeoutMs: 120000,
            navigationTimeoutMs: 120000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            retryRequestDelayMs: 2000,
            maxRetries: 5,
            browser: browserConfig.browser,
            waWebSocketUrl: browserConfig.webSocketUrl,
            connectCooldownMs: 4000,
            phoneResponseTime: 40000,
            qrTimeout: 40000,
            userAgent: `WhatsApp/2.2326.49 Chrome/112.0.5615.49 Linux`,
            customUploadHosts: true,
            getMessage: async () => ({ conversation: config.botName }),
            generateHighQualityLinkPreview: true,
            syncFullHistory: false
        };

        sock = makeWASocket(socketConfig);
        store.bind(sock.ev);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                isConnected = false;

                logger.info(`Connection closed. Status code: ${statusCode}`);

                if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    logger.info(`Reconnecting... Attempt ${reconnectAttempts}`);
                    setTimeout(async () => {
                        await cleanTempFiles();
                        connectToWhatsApp();
                    }, RECONNECT_INTERVAL * reconnectAttempts);
                } else {
                    logger.error('Connection closed permanently');
                    process.exit(1);
                }
            } else if (connection === 'open') {
                isConnected = true;
                reconnectAttempts = 0;
                logger.info('Connected to WhatsApp');
                
                if (initialConnection) {
                    await sock.sendMessage(sock.user.id, { 
                        text: '🤖 Bot Successfully Connected\n\n' +
                              '📱 Device: Chrome Linux\n' +
                              '⚡ Status: Online\n' +
                              '🕒 Time: ' + new Date().toLocaleString()
                    });
                    initialConnection = false;
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                for (const msg of messages) {
                    await handleIncomingMessage(msg);
                }
            }
        });

        sock.ev.on('presence.update', json => logger.info('presence:', json));
        sock.ev.on('chats.update', m => logger.info('chats update:', m));
        sock.ev.on('contacts.update', m => logger.info('contacts update:', m));

        sock.ws.on('CB:call', async (json) => {
            if (json.content[0].tag === 'offer') {
                const callerId = json.content[0].attrs['call-creator'];
                await sock.sendMessage(callerId, { 
                    text: '❌ Calls are not supported. Please send a message instead.' 
                });
            }
        });

        return sock;
    } catch (error) {
        logger.error('Connection error:', error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connectToWhatsApp, RECONNECT_INTERVAL);
        }
        return null;
    }
}

async function startServer() {
    const port = process.env.PORT || 3000;
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.get('/', (_, res) => res.send(`${config.botName} is running!`));
    
    app.get('/status', (_, res) => {
        res.json({
            status: isConnected ? 'connected' : 'disconnected',
            reconnectAttempts,
            timestamp: new Date().toISOString()
        });
    });

    const server = app.listen(port, '0.0.0.0', () => {
        logger.info(`Server running on port ${port}`);
    });

    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;
}

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Cleaning up...');
    await cleanTempFiles();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Cleaning up...');
    await cleanTempFiles();
    process.exit(0);
});

async function initialize() {
    try {
        await displayBanner();
        await ensureDirectories();
        await cleanTempFiles();

        const hasSession = await loadSessionData();
        if (!hasSession) {
            process.exit(1);
        }

        await connectToDatabase();
        await initializeCommands();
        await connectToWhatsApp();
        await startServer();
        setupKeepAlive();

        const handleError = async (error) => {
            logger.error('Critical error:', error);
            if (error?.message?.includes('Connection Closed') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(connectToWhatsApp, RECONNECT_INTERVAL);
            } else {
                await cleanTempFiles();
                process.exit(1);
            }
        };

        process.on('unhandledRejection', handleError);
        process.on('uncaughtException', handleError);

    } catch (error) {
        logger.error('Initialization failed:', error);
        await cleanTempFiles();
        process.exit(1);
    }
}

initialize();
