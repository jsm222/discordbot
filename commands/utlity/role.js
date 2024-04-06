/**
 * Copyright 2024 Jesper Schmitz Mouridsen and Cait Himes
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS”
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { assignable_roles, logChannelID } = require("../../config.json");

function roleLogger(interaction, message) {
  interaction.client.channels.cache.get(logChannelID).send({
    embeds: [
      new EmbedBuilder()
        .setTitle('Role Management')
        .setAuthor({ name: 'Beastie Bot', iconURL: 'https://cdn.discordapp.com/app-icons/1220378924622544906/11ccacbe9f39548ec287eeaf827bd326.png', url: 'https://github.com/jsm222/discordbot' })
        .setDescription(message)
        .addFields(
          { name: 'Interaction ID', value: interaction.id, inline: true },
          { name: 'Member ID', value: interaction.member.id, inline: true }
        )
        .setTimestamp()
    ]
  });
}

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
    // get the role id the user requested
    const askedRoleName = interaction.options.getString('role');
    // set error text in case of an issue
    let logText = `${interaction.member} tried to self-assign the \`${askedRoleName}\` role and failed.`;
    let success = false;
    // is this role allowed to be assigned?
    if (assignable_roles.findIndex((s) => askedRoleName == s.name) >= 0) {
      // CASE: found role in allowed roles list
      // mark execution as successful
      success = true;
      // convert the role name to a role id
      const askedRoleID = assignable_roles.find((role) => role.name == askedRoleName).id;
      // does the member already have the role?
      if (interaction.member.roles.cache.some(role => role.id == askedRoleID)) {
        // CASE: the member has the role, so remove it
        interaction.guild.members.cache.get(interaction.member.id).roles.remove(askedRoleID);
        logText = `Removed <@&${askedRoleID}> role from ${interaction.member}.`;
      }
      else {
        // CASE: the member does not have the role, so add it
        // reset response text
        logText = "";
        // remove any conflicting roles
        const askedRoleGroup = assignable_roles.find(role => role.name == askedRoleName).group;
        const conflictingRoleIDs = assignable_roles.filter(role => role.group == askedRoleGroup).map(role => role.id);
        for (let i in conflictingRoleIDs) {
          let conflictingRoleID = conflictingRoleIDs[i];
          if (interaction.member.roles.cache.some(role => role.id == conflictingRoleID)) {
            interaction.guild.members.cache.get(interaction.member.id).roles.remove(conflictingRoleID);
            logText += `Removed conflicting <@&${conflictingRoleID}> role from ${interaction.member}.\n`;
            await new Promise(resolve => setTimeout(resolve, 100)); // help fix rate limiting issues
          }
        }
        // add requested role
        interaction.guild.members.cache.get(interaction.user.id).roles.add(askedRoleID);
        logText += `Added <@&${askedRoleID}> role to ${interaction.member}.`;
      }
    }
    // inform user on execution status
    roleLogger(interaction, logText);
    return success ? interaction.reply("Ok. Your roles were updated.") : interaction.reply("Unknown or invalid role.");
  }
}
