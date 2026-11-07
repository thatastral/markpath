# Run Markpath's room in Telegram

Based on Switch's own guide: https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/telegram. Nothing needs to be publicly reachable: Switch opens the connection to Telegram and polls it. You do this once; the rest of the team just chats.

You need: a Telegram account **with a @username** (Switch identifies you by it), an admin account on the Switch server (Switch Console gives you one if it created the server), and a group you can add a bot to.

1. **Create the bot.** In Telegram open @BotFather, send `/newbot`, give it a name and a username ending in `bot`. BotFather shows the token **once**: save it in a password manager and never paste it into a chat or room. If it leaks, send `/revoke`.
2. **Turn Group Privacy off before adding the bot to any chat.** BotFather, `/mybots`, your bot, Bot Settings, Group Privacy, Turn off. Telegram reads this when the bot joins, so a chat the bot is already in has to be repaired by removing and re-adding the bot.
3. **Connect it in Switch Console.** Select the server, open Home, Messaging apps, Connect, choose Telegram, name it, paste the Bot Token and Bot Username, then Connect. Switch starts polling at once, so a bad token is reported there.
4. **Create a Telegram group** and add the bot by its username (it needs no admin rights). Switch creates a room for the group. Telegram bots cannot create groups, and a private chat with the bot never becomes a room: for a one-to-one, make a group with just you and the bot.
5. **Link your account.** Post a message in the group (tag the bot if it is in mention-only mode), then on the server's Home page choose **Link account** and pick yourself. This is how Switch knows you own your agents.
6. **Create the Markpath room** with the template from Markpath's Integrations page (**Copy chat-room template**), choosing Telegram as the messaging app.
7. In Markpath, set **Your chat handle** on Integrations to your Telegram username without the `@`. Approving by replying in the group then works the same as in Mattermost.

Not verified end to end by Markpath's authors: this guide follows Switch's documentation, and nobody on the team has run it against a real Telegram bot yet.
