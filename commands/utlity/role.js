const { SlashCommandBuilder } = require('discord.js');
const  {conf} = require('../../config.js')
  module.exports =  {
    data: new SlashCommandBuilder()
      .setName("role")
      .setDescription("Set your role")
      .addRoleOption(option=>
        option
          .setName('role')
          .setDescription('The role to get')
          .setRequired(true)),

        async execute(interaction) {
          let allowedRoles = conf.ALLOWEDROLES;

        let content = "Unknown or not allowed rule";
              const askedRole = interaction.options.getRole('role')
              let role = allowedRoles[askedRole.id];

              if (role) {

                  if(interaction.member.roles.cache.has(askedRole.id)) {
                    interaction.guild.members.cache.get(interaction.member.id).roles.remove(askedRole.id);
                    content = `role ${askedRole} was revoked from ${interaction.member}`;
                  }
                  else {
                    interaction.guild.members.cache.get(interaction.user.id).roles.add(askedRole);
                content = `role ${askedRole} was assigned to ${interaction.member}`;
                  }
              }


        return interaction.reply(content);
      }
    }



