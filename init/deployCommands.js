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

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token, deployCommands } = require('../config.json');
const fs = require('node:fs');
const path = require('node:path');

// Export a single function called main. This will be executed in index.js as part of the bot startup process.
module.exports = {
	main: async function () {
		// helper function for parsing command data from command modules
		async function parseCommands() {
			// make container for commands
			let commands = [];
			// Grab all the command folders from the commands directory you created earlier
			const foldersPath = path.join(__dirname, '..', 'commands');
			const commandFolders = fs.readdirSync(foldersPath);
			for (const folder of commandFolders) {
				// Grab all the command files from the commands directory you created earlier
				const commandsPath = path.join(foldersPath, folder);
				const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
				// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
				for (const file of commandFiles) {
					const filePath = path.join(commandsPath, file);
					const command = require(filePath);
					if ('data' in command && 'execute' in command) {
						commands.push(command.data.toJSON());
					} else {
						console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
					}
				}
			}
			// return parsed command data
			return commands;
		}

		// helper function for uploading commands to Discord
		async function uploadCommands(commands) {
			// Construct and prepare an instance of the REST module
			const rest = new REST().setToken(token);

			// and deploy your commands!
			(async () => {
				try {
					console.log(`[INFO] Uploader: Started refreshing ${commands.length} application (/) commands.`);

					// The put method is used to fully refresh all commands in the guild with the current set
					const data = await rest.put(
						Routes.applicationGuildCommands(clientId, guildId),
						{ body: commands },
					);

					console.log(`[INFO] Uploader: Successfully reloaded ${data.length} application (/) commands.`);
				} catch (error) {
					// And of course, make sure you catch and log any errors!
					console.error(error);
				}
			})();
		}

		// helper function for updating the cache file
		async function writeCache(cacheData) {
			fs.writeFile(deployCommands.commandCachePath, JSON.stringify(cacheData, null, 4), function writeJSON(err) {
				if (err) return console.log(err);
				console.log('[INFO] Cache: Successfully wrote cache to ' + deployCommands.commandCachePath);
			});
		}

		// parse commands
		let commands = await parseCommands();

		// does the cache exist?
		if (fs.existsSync(deployCommands.commandCachePath)) {
			// CASE: cache exists, so check it
			// load the cache data
			let oldCommandData = require(path.join('..', deployCommands.commandCachePath));
			// does the cache need to be updated?
			if (JSON.stringify(oldCommandData.commands) === JSON.stringify(commands)) {
				// CASE: cache does not need to be updated
				console.log("[INFO] Cache: Current slash commands match local cache. Refusing to update.");
			} else {
				// CASE: cache does need to be updated
				console.log("[INFO] Cache: Current slash commands do not match the cache. Updating cache and sending to Discord.");
				oldCommandData.commands = commands;
				writeCache(oldCommandData);
				uploadCommands(commands);
			}
		} else {
			// CASE: cache does not exist, so create it
			console.log("[INFO] Cache: Cache file does not exist. Creating it and sending slash commands to Discord.");
			let commandData = Object();
			commandData.commands = commands;
			writeCache(commandData);
			uploadCommands(commands);
		}
	}
}