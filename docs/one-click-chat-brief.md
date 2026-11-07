# Brief: one-click chat install (for Opencode)

Goal: a Markpath user connects Discord, Slack or Telegram with one click, never seeing BotFather, manifests or tokens.

How: Markpath owns one registered bot per chat app and hosts the Switch server and agents.
1. **Research first** (no code): read https://docs.switchagents.ai (self-host, messaging apps, managed hosts). Answer: can one Switch server serve many customer workspaces through one bot per app? Does Switch offer managed hosting or shared bots? Report before building.
2. **Discord:** one Markpath Discord application. "Add to Discord" = OAuth2 invite URL with `bot applications.commands` scopes and permissions 275683314768. After install, Discord returns the guild id: map it to the Markpath workspace.
3. **Slack:** one distributable Slack app (Socket Mode or Events API), "Add to Slack" OAuth v2 button; store the team's bot token encrypted per workspace.
4. **Telegram:** one @MarkpathBot. "Add to Telegram" = `https://t.me/MarkpathBot?startgroup=<one-time workspace code>`; the bot reads the code from `/start` and links the group to the workspace.
5. **Markpath side:** Integrations "Chat room" step becomes three buttons; the room is created automatically with the four agents; the step turns green when the first agent replies.
6. **Hosting:** one always-on server (2 vCPU / 4 GB, Ubuntu) running Switch server + agents, signed in to Claude, Figma and Canva connectors.

Rules: keep Markpath's approval and QA rules unchanged; secrets encrypted with the existing `src/server/crypto/secrets.ts`; tests for workspace mapping; no changes to the agent playbooks without saying so.
Done when: a new workspace connects Discord in under one minute with no copy-paste.
