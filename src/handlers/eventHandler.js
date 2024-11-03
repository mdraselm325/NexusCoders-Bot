const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class EventHandler {
    constructor() {
        this.events = new Map();
        this.cooldowns = new Map();
    }

    async loadEvents() {
        const eventsPath = path.join(__dirname, '..', 'events');
        const eventFiles = await fs.readdir(eventsPath);
        
        for (const file of eventFiles) {
            if (!file.endsWith('.js')) continue;
            try {
                const event = require(path.join(eventsPath, file));
                if (event.name && event.execute) {
                    this.events.set(event.name, event);
                    logger.info(`Loaded event: ${event.name}`);
                }
            } catch (error) {
                logger.error(`Error loading event ${file}:`, error);
            }
        }
    }

    async handleEvent(eventName, ...args) {
        const event = this.events.get(eventName);
        if (!event) return;

        const now = Date.now();
        const cooldownKey = `${eventName}-${args[1]}`; // group ID as part of cooldown key
        const cooldown = this.cooldowns.get(cooldownKey) || 0;

        if (now < cooldown) return;

        try {
            await event.execute(...args);
            this.cooldowns.set(cooldownKey, now + 2000); // 2 second cooldown
            setTimeout(() => this.cooldowns.delete(cooldownKey), 2000);
        } catch (error) {
            logger.error(`Error executing event ${eventName}:`, error);
        }
    }
}

module.exports = new EventHandler();
