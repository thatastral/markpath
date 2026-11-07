# Run Markpath's room in Microsoft Teams

From Switch's guide: https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/microsoft-teams. Not yet run by Markpath's authors. **Unlike the other apps, Teams needs a public HTTPS address** for Switch, and a Microsoft 365 / Azure admin. Treat it as the last one to set up.

1. **Azure (admin):** create an app registration (client id, client secret, tenant id) and an Azure Bot resource on it. Messaging endpoint: `https://<your-public-host>/api/messages`. Enable the Teams channel.
2. **Graph permissions (admin consent):** `ChannelMessage.Read.Group` (or tenant-wide `ChannelMessage.Read.All` for private/shared channels), plus `Channel.Create`, `Channel.ReadBasic.All`, `User.ReadBasic.All`, `TeamMember.ReadWrite.All` (and `ChannelMember.ReadWrite.All` for private channels).
3. **Public HTTPS:** route `/api/messages` and `/api/teams/notifications` to the Switch Teams listener (port 3978). Valid TLS is required.
4. **Teams app package:** take the manifest from Switch's page, replace the null GUID in `id`, `bots[0].botId` and `webApplicationInfo.id` with the bot's app id, set `validDomains` to your host, delete the `authorization` block unless using resource-specific consent, zip flat with `zip -j agent-switch-teams.zip manifest.json color.png outline.png`, and upload it (sideload or admin center). Raise `version` on every re-upload.
5. **Connect in Switch Console:** Messaging apps, Connect, Microsoft Teams. Fill App Id, App Password, Tenant Id, Team Id, Public Base Url.
6. **Link your account**, add the app to the channel, copy the channel id (Get link to channel, decode it) and create the room with "Use existing channel".
7. In Markpath set **Your chat handle** to your Teams name.

Notes: agents answer only when tagged unless Graph notifications work (see Switch's troubleshooting); attachments are not carried; agent messages appear as cards.
