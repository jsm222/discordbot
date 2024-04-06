const { Events } = require('discord.js');

// log all messages
module.exports = {
    name: Events.MessageCreate,
    execute(message) {
        console.log(`Message data: ${JSON.stringify(message)}}\n\n\n`);
    },
};
