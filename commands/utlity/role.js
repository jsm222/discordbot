const { SlashCommandBuilder } = require('discord.js');
const { assignable_roles } = require("../../config.json");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Assign a role to yourself")
    .addStringOption(option =>
      option
        .setName('role')
        .setDescription('name of the role')
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(Math.max(...assignable_roles.map((role) => role.name.length)))
    )
    .setDMPermission(false),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = assignable_roles.map((role) => role.name);
    const filtered = choices.filter(choice => choice.startsWith(focusedValue));
    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice })),
    );
  },

  async execute(interaction) {
    // set error text in case of an issue
    let responseText = "Unknown or invalid role.";
    // fetch the role ids defined in config.json
    let allowedRoleIDs = assignable_roles.map(i => i.id);
    // get the role id the user requested
    const askedRoleID = interaction.options.getRole('role');
    // is this role allowed to be assigned?
    if (allowedRoleIDs.findIndex((s) => askedRoleID == s) >= 0) {
      // CASE: found role in allowed roles list
      // does the member already have the role?
      if (interaction.member.roles.cache.some(role => role.id == askedRoleID)) {
        // CASE: the member has the role, so remove it
        interaction.guild.members.cache.get(interaction.member.id).roles.remove(askedRoleID);
        responseText = `Removed ${askedRoleID} role from ${interaction.member}.`;
      }
      else {
        // CASE: the member does not have the role, so add it
        interaction.guild.members.cache.get(interaction.user.id).roles.add(askedRoleID);
        responseText = `Added ${askedRoleID} role to ${interaction.member}.`;
      }
    }
    // inform user on execution status
    return interaction.reply(responseText);
  }
}