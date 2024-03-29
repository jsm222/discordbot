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

  // this code runs each time a user is typing out a command that starts with /role
  async autocomplete(interaction) {
    // grab the user's typed string so far
    const focusedValue = interaction.options.getFocused();
    // get the possible options
    const choices = assignable_roles.map((role) => role.name);
    // make an array of relevant suggestions
    const filtered = choices.filter(choice => choice.startsWith(focusedValue));
    // give the suggestions to the user
    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
  },

  // this code runs when a user submits a completed /role command
  async execute(interaction) {
    // set error text in case of an issue
    let responseText = "Unknown or invalid role.";
    // get the role id the user requested
    const askedRoleName = interaction.options.getString('role');
    // is this role allowed to be assigned?
    if (assignable_roles.findIndex((s) => askedRoleName == s.name) >= 0) {
      // CASE: found role in allowed roles list
      // convert the role name to a role id
      const askedRoleID = assignable_roles.find((role) => role.name == askedRoleName).id;
      // does the member already have the role?
      if (interaction.member.roles.cache.some(role => role.id == askedRoleID)) {
        // CASE: the member has the role, so remove it
        interaction.guild.members.cache.get(interaction.member.id).roles.remove(askedRoleID);
        responseText = `Removed <@&${askedRoleID}> role from ${interaction.member}.`;
      }
      else {
        // CASE: the member does not have the role, so add it
        // reset response text
        responseText = "";
        // remove any conflicting roles
        const askedRoleGroup = assignable_roles.find(role => role.name == askedRoleName).group;
        const conflictingRoleIDs = assignable_roles.filter(role => role.group == askedRoleGroup).map(role => role.id);
        for (let i in conflictingRoleIDs) {
          let conflictingRoleID = conflictingRoleIDs[i];
          if (interaction.member.roles.cache.some(role => role.id == conflictingRoleID)) {
            interaction.guild.members.cache.get(interaction.member.id).roles.remove(conflictingRoleID);
            responseText += `Removed conflicting <@&${conflictingRoleID}> role from ${interaction.member}.\n`;
          }
        }
        // add requested role
        interaction.guild.members.cache.get(interaction.user.id).roles.add(askedRoleID);
        responseText += `Added <@&${askedRoleID}> role to ${interaction.member}.`;
      }
    }
    // inform user on execution status
    return interaction.reply(responseText);
  }
}