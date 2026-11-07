# Run Markpath's room in Discord

From Switch's guide: https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/discord. No public address is needed. Not yet run end to end by Markpath's authors.

1. **Create the bot.** Discord Developer Portal, New Application. On the Bot tab copy the bot token.
2. **Turn on two privileged intents** (Bot tab): Server Members and Message Content. Without Message Content the bot cannot read messages.
3. **Invite it.** OAuth2, URL Generator, scopes `bot` and `applications.commands`. Permissions: View Channels, Send Messages, Send Messages in Threads, Manage Webhooks, Manage Channels, Manage Roles, Read Message History, Attach Files, Add Reactions. Open the URL and add the bot to your server.
4. **Copy the server id** (Developer Mode on, right-click the server, Copy Server ID).
5. **Connect in Switch Console** (admin only): Home, Messaging apps, Connect, Discord. Paste the bot token and server id. Leave name autocomplete on.
6. **Link your account**: "This is me".
7. **Bring Switch into a channel**: post any message in the channel (inviting the bot does not create the room). Then create the Markpath room from the template on Markpath's Integrations page and choose Discord.
8. In Markpath, set **Your chat handle** to your Discord username so approving by reply works.

Each agent gets a Discord role named after it, so `@mp-director` autocompletes. If slash commands do not appear, the bot was invited without `applications.commands`: rebuild the invite with both scopes, re-invite, restart the connection.
