const { SapphireClient } = require('@sapphire/framework');
const { GatewayIntentBits } = require('discord.js');

const client = new SapphireClient({ intents: [GatewayIntentBits.MessageContent,GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] , loadMessageCommandListeners: true });
try {
        client.logger.info('Logging in');
client.login('<BOTTOKEN>');
        client.logger.info('logged in');
    } catch (error) {
        client.logger.fatal(error);
        client.destroy();
        process.exit(1);
    }
