# Setup

## 1. Run Markpath
Hosted: https://markpath.vercel.app. Sign up, create a workspace and follow the setup steps.

Local (Node 24):
```bash
cp .env.example .env.local
npm install
npm run demo:reset   # demo workspace "Nexa" with sample issues
npm run dev          # http://localhost:3000, demo@markpath.local / markpath-demo
```
Checks before you ship: `npm run typecheck && npm test && npm run build`.

## 2. Brand rules
Onboarding step 1 reads a PDF, Markdown or text guideline, a website, or a Figma or Canva link, and pre-fills the primary colour, typeface, button radius and tone of voice. Add the **old values to replace**: they are what the agents look for. Save to create version 1.0. Later, Brand rules → Edit rules creates a new version.

## 3. Connect your tools
- **GitHub:** Connect GitHub, enter the code on github.com, choose a repository (or create a sample one).
- **Figma / Canva:** paste the file links. On the computer that runs your agents, connect Figma and Canva once in Claude (claude.ai/settings/connectors). Figma edits need a Full seat.

## 4. Chat room (Switch)
1. Install **Switch Console** (the desktop app that runs the agents), start a local server.
2. In Markpath, name your agents (for example `mp` gives `@mp-director`), then **Copy room template**.
3. In Switch Console, create a room from that template and choose your chat app: the bundled Mattermost needs nothing else. For Discord, Slack, Telegram or Teams, connect the app first (guides in `docs/setup-*.md`).
4. Send `@mp-director what's the status?`. The setup step turns green when an agent answers.
5. Set **Your chat username** so `approve` replies from you are recognised.

## 5. Use it
- `@mp-director fix the issues` → approval request → reply `@mp-director approve` → fixes in Figma, Canva and a GitHub pull request → QA → issues close.
- `@mp-director is this on brand? <link>` → read-only review on the Reviews page.

Agents run on the machine with Switch Console and stop when it sleeps. For a team, see `docs/agents-on-a-server.md`.
