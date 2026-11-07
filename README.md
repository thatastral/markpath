# Markpath

**Brand operations run by a team of agents in a Switch room.** Markpath finds off-brand colours, fonts and corner radii in your code, Figma files and Canva designs, asks a person to approve the exact change, fixes it through the real tools, and has a separate agent check the result.

- **Live:** https://markpath.vercel.app
- **Built for:** WeMakeDevs × Switch "Flip the Switch" (Nov 2026)
- **Demo script:** [docs/demo-script.md](docs/demo-script.md) · **Submission notes:** [docs/submission.md](docs/submission.md) · **Blog post:** [docs/blog-post.md](docs/blog-post.md)

## How it works

1. **Detect.** Ask in the chat room: `@mp-director fix the issues`, or paste any link and ask "is this on brand?". The agents read the real GitHub repository, Figma file and Canva design.
2. **Coordinate.** The Brand Director plans the work and posts one approval: what changes, where, from which value to which. Nothing changes yet.
3. **Correct.** A person replies `approve` in chat (or clicks Approve on the dashboard or the link). The Design agent edits Figma and Canva through their official connectors; the Implementation agent opens a GitHub pull request. Nothing is ever merged.
4. **Verify.** Brand QA re-reads every changed file on its own. Markpath decides pass or fail from those counts, and closes the issues only when QA confirms.

Judgement calls (text contrast, tone of voice, logo use, leftover template text) are flagged for a person and never auto-fixed.

## Why Switch is central

The agents live in a Switch room and work only when someone mentions them. Switch carries the hand-offs (Director → Design → Implementation → QA), the plain-language conversation, and the approvals by reply. Markpath is the system of record: brand rules, issues, approvals, evidence and activity. Without the room there is no coordination, no approval in chat and no independent QA hand-off.

## How Switch is set up

- **Agents:** four Claude Code agents (`mp-director`, `mp-design`, `mp-implementation`, `mp-qa`), created from the room template in [`switch/markpath-ops.template.yaml`](switch/markpath-ops.template.yaml). Markpath's Integrations page fills in each agent's key and the site address, so you copy one template.
- **Channel:** a Telegram group with the Switch bot as admin (Group Privacy off). In Switch Console: connect Telegram, create the room from the template, attach it to the group, link your account. Each agent's addressing is "Anyone", so teammates can ask; only the workspace owner can approve.
- **How the work flows:** the agents only act when mentioned. They fetch their instructions from Markpath (`/api/agent/playbook`) on every message, call Markpath's API to audit, request approval, apply and verify, and hand off to each other with mentions.
- **Run it:** step-by-step in [docs/setup.md](docs/setup.md) and [docs/setup-telegram.md](docs/setup-telegram.md).

## What's in the app

| Area | What it does |
| --- | --- |
| Onboarding | After creating a workspace: brand rules from a PDF, Markdown file, website or design link (you confirm the values), logo, GitHub, Figma and Canva links, chat room |
| Overview | What needs your decision, recent activity, tool status |
| Issues and approvals | Issues grouped by rule and file, old → new values, Open in Figma / Canva / GitHub, approval cards |
| Brand rules | Versioned rules (one in use), edit or re-read from a new guideline, reference logo |
| Reviews | Read-only link checks, pull request checks, scheduled repository audits |
| Activity | Every agent message, approval and change |
| Integrations | Guided setup with live "this worked" checks, chat-app guides for Discord, Slack, Telegram and Teams |

Light and dark themes (System / Light / Dark), keyboard support, and phone layouts throughout.

## Honest status

| Integration | Status |
| --- | --- |
| GitHub | Real: device-flow sign-in, branch and pull request, re-read through the API. Never merges or touches the default branch. |
| Figma | Real edits through the Figma connector (needs a Full seat), re-read by QA. |
| Canva | Real edits through the Canva connector: colours and wording, not fonts. Runs as the Canva account connected to the agents. |
| Switch | Real room with four Claude agents. Tested end to end in Telegram with teammates and in the bundled Mattermost. Discord, Slack and Teams follow Switch's guides and were not run end to end. |
| Password reset email | Built; sending needs a verified domain in Resend, so it is off on the live site. |

## Run locally

Needs Node 24 (`.nvmrc`).

```bash
cp .env.example .env.local
npm install
npm run demo:reset
npm run dev
```

Open http://localhost:3000 and sign in with `demo@markpath.local` / `markpath-demo` (local only; never use these on a hosted site). Then follow [docs/setup.md](docs/setup.md) to connect Switch.

```bash
npm run typecheck && npm test && npm run build
```

## Deploy

Vercel with a Turso database from the Vercel Marketplace: see [docs/deploy-for-a-team.md](docs/deploy-for-a-team.md). Docker works too (`docker compose up`).

## Docs

[Overview](docs/overview.md) · [Architecture](docs/architecture.md) · [Setup](docs/setup.md) · [Decisions](docs/decisions.md) · [Talking to the agents](docs/talking-to-agents.md) · [End-to-end audit](docs/e2e-audit.md) · [Retrospective](docs/retrospective.md) · Chat apps: [Slack](docs/setup-slack.md), [Discord](docs/setup-discord.md), [Telegram](docs/setup-telegram.md), [Teams](docs/setup-teams.md)
