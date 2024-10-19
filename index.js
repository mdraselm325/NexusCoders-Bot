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
let isConnecting = false;
const sessionDir = path.join(process.cwd(), 'auth_info_baileys');
const MAX_RETRIES = 5;
let retryCount = 0;

async function displayBanner() {
    return new Promise((resolve) => {
        figlet(config.botName, (err, data) => {
            if (!err) console.log(gradient.rainbow(data));
            resolve();
        });
    });
}

async function ensureDirectories() {
    await Promise.all([
        fs.ensureDir(sessionDir),
        fs.ensureDir('temp'),
        fs.ensureDir('assets'),
        fs.ensureDir('logs')
    ]);
}

async function processSessionData() {
    if (!process.env.SESSION_DATA) return false;
    
    try {
        const sessionData = JSON.parse(Buffer.from(process.env.SESSION_DATA, 'base64').toString());
        await fs.emptyDir(sessionDir);
        
        for (const [key, value] of Object.entries(sessionData)) {
            const filePath = path.join(sessionDir, key);
            await fs.outputJSON(filePath, value, { spaces: 2 });
        }
        return true;
    } catch (error) {
        logger.error('Session data processing failed:', error);
        return false;
    }
}

async function backupSession() {
    try {
        const files = await fs.readdir(sessionDir);
        const sessionData = {};
        
        for (const file of files) {
            const filePath = path.join(sessionDir, file);
            const content = await fs.readJSON(filePath);
            sessionData[file] = content;
        }
        
        const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');
        return encodedSession;
    } catch (error) {
        logger.error('Session backup failed:', error);
        return null;
    }
}

async function connectToWhatsApp() {
    if (isConnecting) return null;
    isConnecting = true;

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        
        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: P({ level: 'silent' }),
            browser: Browsers.appropriate('Chrome'),
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            retryRequestDelayMs: 5000,
            maxRetries: 5,
            qrTimeout: 40000,
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
                const shouldReconnect = (
                    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut &&
                    lastDisconnect?.error?.output?.statusCode !== 440
                );
                isConnecting = false;

                if (shouldReconnect && retryCount < MAX_RETRIES) {
                    retryCount++;
                    logger.info(`Reconnecting... Attempt ${retryCount}`);
                    setTimeout(connectToWhatsApp, 5000 * retryCount);
                } else {
                    logger.error('Connection terminated');
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                retryCount = 0;
                isConnecting = false;
                logger.info('Connected to WhatsApp');

                if (initialConnection) {
                    initialConnection = false;
                    try {
                        const sessionBackup = await backupSession();
                        if (sessionBackup) {
                            logger.info('Session backup created successfully');
                        }
                        
                        await sock.sendMessage(
                            `${config.ownerNumber}@s.whatsapp.net`,
                            { text: await startupMessage() }
                        );
                    } catch (error) {
                        logger.error('Startup message failed:', error);
                    }
                }
            }
        });

        sock.ev.on('creds.update', async () => {
            await saveCreds();
            if (process.env.RENDER) {
                const sessionBackup = await backupSession();
                if (sessionBackup) {
                    logger.info('New session data:', sessionBackup);
                }
            }
        });

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
        isConnecting = false;
        logger.error('Connection error:', error);
        
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(connectToWhatsApp, 5000 * retryCount);
        } else {
            process.exit(1);
        }
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
        await connectToDatabase();
        await processSessionData();
        await initializeCommands();
        await connectToWhatsApp();
        await startServer();

        process.on('unhandledRejection', (error) => {
            logger.error('Unhandled rejection:', error);
            if (error.message?.includes('Session closed')) {
                setTimeout(connectToWhatsApp, 5000);
            }
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            if (error.message?.includes('Session closed')) {
                setTimeout(connectToWhatsApp, 5000);
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
