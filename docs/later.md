# Later (agreed with the owner, 2026-11-06)

Not for the Flip the Switch submission unless time is left. Do not forget these.

## Product
- Landing page.
- UI cleanup and polish (Claude, after the flows work): all five pages, onboarding, Figma plugin UI.
- Smooth connect experience for Figma, GitHub and Canva (owner's priority after the live room flow works). Plan: GitHub via device-flow OAuth with real branch and pull request; Figma through the plugin (runs in the user's own Figma session, no Figma OAuth needed); Canva Connect OAuth only if developer access and an eligible Autofill template exist, otherwise stay honestly "not available".
- Workspaces: sign-up, create and switch workspace, "Try the demo workspace", setup checklist.
- Logo and asset upload, manual editing of colours and typography in Brand profile.
- Approvals from chat (needs a verified mapping between the Switch sender and the Markpath user).

## Deployment for outside teams
- Hosted Markpath on a public URL with a real database (SQLite is local only).
- Hosted Switch server and managed-machine agents so users never install Switch Console.
- Slack (Socket Mode app) and Telegram (BotFather bot) connections, set up once per company. Switch's self-host and per-app docs have not been read yet.
- Write an honest "Deploying for a team" doc.

## Done since this list was written
- Vet any link (Figma, Canva, pull request), pull request checks, scheduled repository audits, Reviews page.
- Wider rules: text contrast (deterministic), voice and logo (flagged for a person).
- Docker package and guides for Slack, Telegram, agents on a server and deploying for a team.

## Still open
- Proactive posts into the chat room (chosen: dashboard alerts only for now). Waking the Director on a schedule needs a way to post into the room, so it is not built.
- Per-person Canva links (Markpath-owned Canva app and MCP client).
- Postgres, roles beyond owner and member, a GitHub App instead of the OAuth app.
- The Slack, Telegram and API-key paths are documented from Switch's docs but not run for real.

## Other hackathons
- Builder.io Agent-Native hackathon (deadline 2026-11-09 11:59 PM PT): port after WeMakeDevs is submitted. First read the Agent-Native docs and estimate; ask hackathon@builder.io whether the same project may be submitted to both. The core logic (brand spec, audits, approvals, executors, QA) is framework-independent TypeScript.

## Housekeeping
- Add the Notion tracker row when the owner says so.
- Real GitHub and Figma modes need the fixture fallback kept for "clone and reproduce".
- Rotate agent keys before sharing a recording or the repo (the template button does it).
