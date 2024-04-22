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

const { Events, EmbedBuilder, TextChannel } = require('discord.js');
const { query } = require('../db.js');
const { createHash } = require('crypto');
const { logChannelID, logger, antispam } = require('../config.json');
const { escapeIdentifier } = require('pg');

function spamLogger(messageData, rule) {
    messageData.client.channels.cache.get(logChannelID).send({
        embeds: [
            new EmbedBuilder()
                .setTitle(`Anti-Spam`)
                .setAuthor({ name: 'Beastie Bot', iconURL: 'https://cdn.discordapp.com/app-icons/1220378924622544906/11ccacbe9f39548ec287eeaf827bd326.png', url: 'https://github.com/jsm222/discordbot' })
                .setDescription(`> ${messageData.content}`)
                .addFields(
                    { name: 'Author Username', value: messageData.author.username, inline: true },
                    { name: 'Author ID', value: messageData.author.id, inline: true },
                    { name: 'Timestamp', value: String(messageData.createdTimestamp), inline: true },
                    { name: 'Rule', value: rule, inline: true }
                )
                .setTimestamp()
        ]
    });
}

// detect same channel spam
async function processSameChannelSpam(messageData, messageHash) {
    // check for channel spam
    let spamCheck = await query(
        `
            SELECT COUNT (*) hits
            FROM ${escapeIdentifier(logger.tableName)}
            WHERE CHANNEL_ID=$1 AND AUTHOR_ID=$2 AND MESSAGE_HASH=$3 AND TIMESTAMP>=(
                SELECT TIMESTAMP
                FROM ${escapeIdentifier(logger.tableName)}
                WHERE CHANNEL_ID=$1 AND AUTHOR_ID=$2 AND MESSAGE_HASH=$3
                ORDER BY TIMESTAMP DESC
                LIMIT 1
            )-${antispam.maxSameChannelTimeDifference};
        `,
        [messageData.channelId, messageData.author.id, messageHash]
    );
    if (spamCheck.rowCount > 0 && spamCheck.rows.at(0).hits >= antispam.maxSameChannelRepeats) {
        // CASE: found N message repeats by the same user in the same channel in the checked time interval
        // log moderation event
        spamLogger(messageData, "Same Channel");
        // timeout the user
        messageData.guild.members.cache.get(messageData.author.id).timeout(antispam.memberTimeoutMinutes * 60 * 1000).catch((error) => {
            console.error(`[ERROR] Antispam: Failed to timeout user ${messageData.author.id}. Error: ${error}`);
        });
        // delete their messages with the same hash
        let spamMessageList = await query(
            `
                SELECT MESSAGE_ID
                FROM ${escapeIdentifier(logger.tableName)}
                WHERE CHANNEL_ID=$1 AND AUTHOR_ID=$2 AND MESSAGE_HASH=$3;
            `,
            [messageData.channelId, messageData.author.id, messageHash]
        );
        if (spamMessageList.rowCount > 0) {
            for (let i in spamMessageList.rows) {
                let deleteTargetID = spamMessageList.rows.at(i).message_id;
                // code to delete messages on the server came from https://www.reddit.com/r/discordbot/comments/hrnu4s/comment/fy6fwb8/
                messageData.client.channels.cache.get(messageData.channelId).messages.fetch(deleteTargetID).then((m) => m.delete()).catch((error) => {
                    console.error(`[ERROR] Antispam: Failed to delete message with CHANNEL_ID=${messageData.channelId} and MESSAGE_ID=${deleteTargetID}. Error: ${error}`);
                });
                // delete the message from the database (this prevents some potential API errors on future spam detections, specifically the Unknown Message error)
                query(
                    `
                        DELETE
                        FROM ${escapeIdentifier(logger.tableName)}
                        WHERE CHANNEL_ID=$1 AND AUTHOR_ID=$2 AND MESSAGE_ID=$3;
                    `,
                    [messageData.channelId, messageData.author.id, deleteTargetID]
                );
            }
        }
    }
}

// detect cross channel spam
async function processCrossChannelSpam(messageData, messageHash) {
    // TODO: implement this logic
    return false;
}

// log the sign in to stdout upon load
module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // do not process bot messages
        if (message.author.id == message.client.user.id) {
            return;
        }
        // do not run if the database does not exist
        let dbSafe = await query(`SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='${logger.tableName}';`);
        if (dbSafe.rowCount == 0) {
            return;
        }
        // message.channelId, message.author.id, message.id, createHash('sha512').update(message.content).digest('hex'), message.createdTimestamp);
        // generate message hash
        let messageHash = createHash('sha512').update(message.content).digest('hex');
        // check for SAME CHANNEL spam
        await processSameChannelSpam(message, messageHash);
        await processCrossChannelSpam(message, messageHash);
    },
};
