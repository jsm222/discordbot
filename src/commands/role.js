const { Command } = require('@sapphire/framework');
class RoleCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'role',
      aliases: [''],
      description: 'get or drop a role'
    });
  }

    async messageRun(message,args) {
        let allowedRoles = {
      "red": "829911983578939404",
      "orange":"829912157901815808",
      "yellow":"829912254757339147",
      "green":"829912305495834624",
      "blue":"829912493215711240",
      "purple":"829912623016575016",
      "pink":"829912653577191427",
      "vc-ping":"1021280420152737934",
      "free-games-ping":"1030604414769168385"
  }
  let content = "Unknown or not allowed rule";
        const msg = await message.channel.send('role?');
        const askedRole = await args.pick('string');
        let role = allowedRoles[askedRole];
        if (role) {

            if(message.guild.members.cache.get(message.author.id).roles.cache.has(role)) {
                message.guild.members.cache.get(message.author.id).roles.remove(role);
        content = `role ${askedRole} was revoked from ${message.member}`;
            }
            else {
                message.guild.members.cache.get(message.author.id).roles.add(role);
        content = `role ${askedRole} was assigned to ${message.member}`;
            }
        }




    return msg.edit(content);
  }
}
module.exports = {
  RoleCommand
};

