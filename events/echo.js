const { Events } = require('discord.js');

// log all messages
module.exports = {
    name: Events.MessageCreate,
    execute(message) {
        console.log(`Message created: ${JSON.stringify(message)}}\n\n\n`);
    },
};
