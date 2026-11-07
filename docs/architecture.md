# Architecture

```
Team in Slack / Discord / Telegram / Mattermost
        │  @mp-director fix the issues
        ▼
Switch room ── Director ── Design ── Implementation ── QA   (Claude agents, run by Switch Console)
        │ HTTPS + per-agent keys          │ Figma MCP / Canva MCP      │ GitHub API
        ▼                                  ▼                            ▼
Markpath (Next.js on Vercel) ── Turso (SQLite) ── approvals, findings, tasks, activity
        ▲
        └── Dashboard: onboarding, issues, approvals, brand rules, reviews, activity
```

## Pieces
- **Next.js 16 app router** (`src/app`): dashboard, onboarding, auth, and the agent API under `src/app/api/agent/*` and `src/app/api/plugin/*`.
- **Server** (`src/server`): brand rules and extraction (`brand/`), audits (`audits/`), task engine and approvals (`tasks/`, `agents/operations.ts`), integrations (`integrations/`: GitHub device flow and API, Figma and Canva links, link vetting, PR watch), tokens and room template (`tokens/`), auth with sessions and password reset (`auth/`).
- **Database**: `libsql`, a better-sqlite3 compatible driver. A local SQLite file in development; Turso when `TURSO_DATABASE_URL` is set. `src/server/db/client.ts` smooths over the driver differences (row metadata, nested transactions, named parameters).
- **Agent playbooks** are served by Markpath (`GET /api/agent/playbook`), so workflow changes never need a new Switch room. The room template only carries short instructions and the workspace's agent keys.

## Safety rules enforced by the server
- Per-workspace, per-role agent keys (hashed and encrypted); each role can only call its own endpoints.
- Approvals are bound to a SHA-256 fingerprint of resource, operation and payload, and are single use.
- Chat approvals accept only a plain yes or no from a recognised owner and are labelled as relayed.
- Verification is decided by Markpath from QA's independent re-read counts. Judgement items (contrast, voice, logo, placeholders) never pass or fail automatically.
- GitHub changes are a branch and pull request only; the default branch is checked to be unchanged.
- Website reading for brand rules blocks private addresses.

## Scheduled work
On a long-running host the PR watcher polls every minute. On Vercel it runs as a daily cron (`vercel.json`, Hobby plan limit).
