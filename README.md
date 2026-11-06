# Markpath

Markpath is an agentic brand-operations control centre: it turns approved brand rules into an evidence-led **Detect → Coordinate → Correct → Verify** workflow across design and code.

The Next.js dashboard owns approvals and the operational record. Switch Rooms is the collaboration layer for the Brand Director, Design Agent, Implementation Agent, and Brand QA—not a replacement database.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run demo:reset
npm run dev
```

Open `http://localhost:3000` and sign in as `demo@markpath.local` with password `markpath-demo`.

## Reproducible fixture demo

`npm run demo:reset` clears and rebuilds only Markpath's local demo records, uploads, and fixture workspace. It stages an approved Nexa 2.0 specification, six confirmed findings, and two *pending, resource-bound* correction approvals. It does not change fixture resources.

1. Run `npm run demo:reset` and sign in.
2. Open **Issues & approvals** and approve each exact proposed operation.
3. Run `npm run demo:complete` in another terminal.
4. Refresh the dashboard. The task reaches `COMPLETED` only after the independent fixture QA checks confirm the new values, legacy values are absent, and the Git diff only contains the token file.

`npm run demo:complete` refuses until both dashboard approvals exist. It writes only local fixture data; it never touches a real default branch or merges anything.

## Switch Rooms setup

1. In Switch Console, start the local Switch server and sign into its bundled Mattermost app.
2. Delete or edit any previous Markpath template card—the Console preserves its old YAML rather than reading this repository automatically.
3. Import or paste [`switch/markpath-ops.template.yaml`](switch/markpath-ops.template.yaml) as the whole template, then choose `markpath`, your signed-in provider, `local`, and Mattermost.
4. Create the room, then send an addressed message to `@markpath-director`.

The dashboard treats `/health` as server reachability only. Switch remains **not connected** until a real, addressed room reply is recorded in `agent_activity`.

## Integration truthfulness matrix

| Integration | Mode | Verified capability | Deliberate limitation |
| --- | --- | --- | --- |
| GitHub | Fixture | Local branch, commit, and independent diff verification | Not a GitHub PR; no real repository connection |
| Figma | Fixture | Local snapshot scan, approved fixture write, and re-read QA | Not a Figma API write; plugin is not yet tested in Figma |
| Canva | Disabled | None | Intentionally not connected |
| Switch Rooms | Local adapter | Health adapter and Console-importable room template | Core must be running and an agent reply must still be verified |

## Checks

```bash
npm run typecheck
npm test
npm run build
```

See [docs/setup.md](docs/setup.md), [docs/demo-script.md](docs/demo-script.md), and [docs/architecture.md](docs/architecture.md) for details.
