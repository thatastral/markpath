# Markpath

Markpath coordinates brand consistency work across design and code: **Detect → Coordinate → Correct → Verify**.

It combines a Next.js dashboard, a local SQLite operational record, integration adapters, and Switch Rooms for four specialized agents: Brand Director, Design Agent, Implementation Agent, and Brand QA.

## Current status

Foundation in progress. Local SQLite, seeded auth, and an honest integration-status shell are implemented. Switch, Docker, GitHub, Figma, the Figma plugin, scans, approvals, execution, and QA verification are not yet validated or claimed as working.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run db:seed
npm run dev
```

Visit `http://localhost:3000` and sign in with `demo@markpath.local` / `markpath-demo`.

## Integration truthfulness matrix

| Integration | Current state | Mode | Claim |
| --- | --- | --- | --- |
| GitHub | Not connected | Fixture planned | No repository operation has run. |
| Figma | Not connected | Fixture planned | Plugin is not built or tested yet. |
| Canva | Not connected | Disabled | P1 only. |
| Switch Rooms | Not connected | Not configured | Docker and Switch Console setup are pending. |

## Planned Switch role

Switch is the collaboration system, not the database. A Markpath operations room will host real @mention handoffs among the four agents. Agent tools call the Markpath backend, and the backend records task, approval, execution, verification, and room-message evidence. See `docs/setup.md` and `guides/switch-rooms-integration.md`.
