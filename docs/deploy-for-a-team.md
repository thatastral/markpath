# Deploying Markpath for a team

Three pieces, and who runs each:

| Piece | What it is | Run by |
| --- | --- | --- |
| **Markpath** | This app: dashboard, approvals, agent API, database | You, on a server (see below) |
| **A Switch server** | Rooms and the chat connections (Slack, Telegram, Mattermost) | You, on a server: https://docs.switchagents.ai/switch-rooms/deploy/self-host |
| **The agents** | Claude Code sessions with the Figma and Canva connectors | A host that stays on: see [agents-on-a-server.md](agents-on-a-server.md) |

The people in the chat room install and connect nothing.

## Run Markpath with Docker

```bash
cp .env.example .env          # then set at least the values below
docker compose up -d --build
```

Set in `.env`: `MARKPATH_SESSION_SECRET` (a long random value; the app refuses to start in production without it), `GITHUB_CLIENT_ID` (your GitHub OAuth app with Device Flow enabled) and, if you want, `MARKPATH_PR_WATCH=off`. The database and uploads live in the `markpath-data` volume. The app listens on port 3000; put it behind your organisation's TLS terminator. **The address you open the dashboard on is the address written into the agents' room template**, so open the dashboard on the public URL before you copy the template.

## The Switch server

Follow Switch's current steps in its repository. From its docs: run it with Docker Compose on a Linux machine or with Helm, pin a version, and set `AGENT_REGISTRATION_TOKEN`, `SECRET_KEYS` (at least 32 characters), `GATEWAY_ADMIN_EMAIL`, `GATEWAY_ADMIN_PASSWORD` and `GATEWAY_PUBLIC_URL`. Ports bind to `127.0.0.1` until you set `SWITCH_BIND_ADDR`. Connect Slack or Telegram with [setup-slack.md](setup-slack.md) or [setup-telegram.md](setup-telegram.md).

## What is not production-ready yet (be honest with customers)
- SQLite on one volume: fine for a team, not for several app servers. A Postgres move is not done.
- One session secret, one owner approves; no roles beyond owner and member.
- Figma and Canva edits run through the connected account on the agent host. Canva has no shared account, so edits run as one person; per-person Canva links are not built.
- GitHub uses an OAuth app with the `repo` scope. A GitHub App with per-repository permissions is the right production choice.
- Nothing here has been load tested or security reviewed by a third party.


## Approval links for teammates
Set `MARKPATH_PUBLIC_URL` to the address your team opens (for example `https://markpath.yourcompany.com`). The agents keep calling the API on the address in the room template, but every approval, issues and integrations link they post uses the public address. Without it, links say `localhost`, which only works on the machine running Markpath.

## Vercel (what the live demo uses)
1. `vercel link`, then add the Turso database from the Vercel Marketplace (`vercel integration add tursocloud/database -e production`). It sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`; Markpath uses them automatically and keeps a local SQLite file when they are absent.
2. Set `MARKPATH_SESSION_SECRET`, `GITHUB_CLIENT_ID` and `CRON_SECRET` for production.
3. `vercel deploy --prod`. Pull-request checks run once a day through Vercel Cron (`vercel.json`, the Hobby plan limit); a Docker host checks every minute instead.
4. Sign up on the live site, then copy the room template from its Integrations page so the agents call the hosted address.
