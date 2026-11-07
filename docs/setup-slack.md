# Run Markpath's room in Slack

Based on Switch's own guide: https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/slack. Slack uses Socket Mode, so the Switch server opens the connection and **no public address is needed**. You do this once.

You need: a Slack workspace where you can install a custom app (many require admin approval first: get it before you start) and an admin account on the Switch server.

1. **Create the Slack app from a manifest.** Open https://api.slack.com/apps, Create New App, From an app manifest, pick your workspace, and paste the manifest from Switch's Slack guide (it sets permissions, events, slash commands, Socket Mode and the app home in one step).
2. **Generate the app-level token** and **install the app**, then copy the bot token, and note your **workspace id**. Keep both tokens secret; never put them in a room.
3. **Connect it in Switch Console.** Server, Home, Messaging apps, Connect, choose Slack, name it, paste the tokens and workspace id, decide whether Switch may create channels and whether agent names autocomplete, then Connect.
4. **Link your Slack account** in Switch Console so your agents recognise you as their owner.
5. **Bring Switch into a channel** as Switch's guide describes (a channel becomes a room), then create the Markpath room from the template on Markpath's Integrations page, choosing Slack.
6. In Markpath, set **Your chat handle** on Integrations to your Slack handle so approving by reply works.

Not verified end to end by Markpath's authors: this follows Switch's documentation and has not been run against a real Slack workspace. Read Switch's Troubleshooting section if the app does not appear.
