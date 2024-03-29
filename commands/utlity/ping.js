const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),

  // this code runs when a user executes the command
  async execute(interaction) {
    // respond to user interaction
    await interaction.reply('Pong!')
  },
}
