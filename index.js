require('dotenv').config();
const {
    default: makeWASocket,
    Browsers,
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
const axios = require('axios');
const { connectToDatabase } = require('./src/utils/database');
const logger = require('./src/utils/logger');
const messageHandler = require('./src/handlers/messageHandler');
const config = require('./src/config');
const { initializeCommands } = require('./src/handlers/commandHandler');
const { startupMessage } = require('./src/utils/messages');

const msgRetryCounterCache = new NodeCache();
const store = makeInMemoryStore({});
const app = express();
let sock = null;
let initialConnection = true;
const sessionDir = path.join(process.cwd(), 'session');
const credsPath = path.join(sessionDir, 'creds.json');

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

async function downloadSessionData() {
    if (!process.env.SESSION_DATA) {
        logger.error('Please add your session to SESSION_DATA env!!');
        return false;
    }

    try {
        const data = process.env.SESSION_DATA;
        await fs.writeFile(credsPath, data);
        logger.info("Session Successfully Loaded!!");
        return true;
    } catch (error) {
        logger.error('Failed to load session data:', error);
        return false;
    }
}

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: Browsers.appropriate('Chrome'),
            logger: P({ level: 'silent' }),
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            retryRequestDelayMs: 5000,
            maxRetries: 5,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            getMessage: async () => ({ conversation: config.botName }),
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            }
        });

        store.bind(sock.ev);

        sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    logger.info('Reconnecting...');
                    setTimeout(connectToWhatsApp, 3000);
                } else {
                    logger.error('Connection closed. Logged out.');
                    process.exit(1);
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    logger.info('Integration Successful ✅');
                    await sock.sendMessage(sock.user.id, { text: 'Integration Successful ✅' });
                    initialConnection = false;
                } else {
                    logger.info('Connection reestablished after restart');
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
                            logger.error('Message handling failed:', error);
                        }
                    }
                }
            }
        });

        return sock;
    } catch (error) {
        logger.error('Connection error:', error);
        setTimeout(connectToWhatsApp, 3000);
        return null;
    }
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

        if (fs.existsSync(credsPath)) {
            logger.info("Session file found, proceeding with existing session");
        } else {
            const sessionDownloaded = await downloadSessionData();
            if (!sessionDownloaded) {
                logger.error("No session found or downloaded. Please provide valid SESSION_DATA");
                process.exit(1);
            }
        }

        await connectToDatabase();
        await initializeCommands();
        await connectToWhatsApp();
        await startServer();

        process.on('unhandledRejection', (error) => {
            logger.error('Unhandled rejection:', error);
            if (error.message?.includes('Session closed')) {
                setTimeout(connectToWhatsApp, 3000);
            }
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            if (error.message?.includes('Session closed')) {
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
