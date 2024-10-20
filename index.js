require('dotenv').config();
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const NodeCache = require('node-cache');
const gradient = require('gradient-string');
const figlet = require('figlet');
const { connectToDatabase } = require('./src/utils/database');
const logger = require('./src/utils/logger');
const messageHandler = require('./src/handlers/messageHandler');
const config = require('./src/config');
const { initializeCommands } = require('./src/handlers/commandHandler');
const { startupMessage } = require('./src/utils/messages');

const msgRetryCounterCache = new NodeCache();
const store = makeInMemoryStore({});
store.readFromFile('./baileys_store.json');
setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10_000);

const app = express();
let sock = null;
let initialConnection = true;
const sessionDir = path.join(process.cwd(), 'session');

async function displayBanner() {
    return new Promise((resolve) => {
        figlet(config.botName, (err, data) => {
            if (!err) console.log(gradient.rainbow(data));
            resolve();
        });
    });
}

async function ensureDirectories() {
    await fs.ensureDir(sessionDir);
    await fs.ensureDir('temp');
    await fs.ensureDir('assets');
    await fs.ensureDir('logs');
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

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Chrome (Linux)', 'Chrome', '112.0.5615.49'],
        logger: P({ level: 'silent' }),
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 5000,
        maxRetries: 5,
        getMessage: async () => ({ conversation: config.botName })
    });

    store.bind(sock.ev);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 3000);
            } else {
                process.exit(1);
            }
        } else if (connection === 'open') {
            if (initialConnection) {
                await sock.sendMessage(sock.user.id, { text: 'Bot Connected ✓' });
                initialConnection = false;
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            for (const msg of messages) {
                if (!msg.key.fromMe) {
                    try {
                        await messageHandler(sock, msg);
                    } catch (error) {
                        logger.error('Message handling error:', error);
                    }
                }
            }
        }
    });

    return sock;
}

async function startServer() {
    const port = process.env.PORT || 3000;
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.get('/', (_, res) => res.send(`${config.botName} is running!`));
    app.listen(port, '0.0.0.0', () => {
        logger.info(`Server running on port ${port}`);
    });
}

async function initialize() {
    try {
        await displayBanner();
        await ensureDirectories();

        const hasSession = await loadSessionData();
        if (!hasSession) {
            process.exit(1);
        }

        await connectToDatabase();
        await initializeCommands();
        await connectToWhatsApp();
        await startServer();

        process.on('unhandledRejection', error => {
            logger.error('Unhandled rejection:', error);
            if (error?.message?.includes('Connection Closed')) {
                setTimeout(connectToWhatsApp, 3000);
            }
        });

        process.on('uncaughtException', error => {
            logger.error('Uncaught exception:', error);
            if (error?.message?.includes('Connection Closed')) {
                setTimeout(connectToWhatsApp, 3000);
            } else {
                process.exit(1);
            }
        });

    } catch (error) {
        logger.error('Initialization failed:', error);
        process.exit(1);
    }
}

initialize();
