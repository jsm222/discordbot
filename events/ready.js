const { Events } = require('discord.js');

// log the sign in to stdout upon load
module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`[INFO] Client: Ready! Logged in as ${client.user.tag}`);
    },
};
