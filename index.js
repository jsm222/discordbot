const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { Application } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	// do not respond to any event that is not a command or autocomplete
	if (!(interaction.isChatInputCommand() || interaction.isAutocomplete())) return;

	// grab the commmand being called
	const command = interaction.client.commands.get(interaction.commandName);

	// if the command does not exist, show an error
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
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
});

client.login(token);