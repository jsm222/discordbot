const { SlashCommandBuilder } = require('discord.js');
const { assignable_roles } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Show available roles'),

  // this code runs when a user executes the command
  async execute(interaction) {
    // generate list
    let response = "# Self Assignable Roles\n";
    for (let i in assignable_roles) {
      response += `- **${assignable_roles[i].name}**: ${assignable_roles[i].description}\n`;
    }
    response += "*Use `/role <name>` to apply any role from this list.*\n";
    // respond to user interaction
    await interaction.reply(response);
  },
}
