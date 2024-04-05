const { Events } = require('discord.js');

// respond to interaction events
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // do not respond to any event that is not a command or autocomplete
        if (!(interaction.isChatInputCommand() || interaction.isAutocomplete())) return;

        // grab the command being called
        const command = interaction.client.commands.get(interaction.commandName);

        // if the command does not exist, log as an error to stdout
        if (!command) {
            console.error(`[ERROR] Client: No command matching ${interaction.commandName} was found.`);
            return;
        }

        // is the event an autocomplete or a command?
        if (interaction.isAutocomplete()) {
            // CASE: handle autocomplete event
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        } else {
            // CASE: handle command event
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
    },
};
