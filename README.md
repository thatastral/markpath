# Markpath

> **Flip the Switch submission.** Four agents in a Switch room (Director, Design, Implementation, QA) detect off-brand values in GitHub, Figma and Canva, get a person's approval on the exact change (dashboard, link, or a reply in chat), correct it, and verify it independently. Demo script: [docs/demo-script.md](docs/demo-script.md). Submission notes: [docs/submission.md](docs/submission.md). Talking to the agents: [docs/talking-to-agents.md](docs/talking-to-agents.md). Slack/Telegram: [Slack](docs/setup-slack.md), [Telegram](docs/setup-telegram.md) (documented, not yet run live).

Markpath is an agentic brand-operations control centre: it turns approved brand rules into an evidence-led **Detect → Coordinate → Correct → Verify** workflow across design and code.

The Next.js dashboard owns approvals and the operational record. Switch Rooms is the collaboration layer for the Brand Director, Design Agent, Implementation Agent, and Brand QA—not a replacement database.

## Run locally

Requires Node 24 (`.nvmrc`). The `better-sqlite3` native module is built for the Node version that ran `npm install`; if you switch Node versions run `npm rebuild better-sqlite3`.

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
| GitHub | Fixture by default; **real** once connected | Fixture: local branch, commit and diff check. Real: a branch and pull request on a repository you choose, verified by re-reading it through the GitHub API | Never merges or writes to the default branch. Uses an OAuth app with `repo` scope; a GitHub App with per-repository permissions is the production choice |
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

## Agent-driven workflow (Switch is the control path)

The four agents in the Switch room drive the workflow by calling Markpath's authenticated API. Each agent has its own key, created per workspace and stored hashed, so the audit trail names the real actor and roles are enforced:

| Route | Who may call it | What it does |
| --- | --- | --- |
| `POST /api/agent/audit` | Director | Scans both fixtures, stores findings, creates the task, requests two resource-bound approvals |
| `GET /api/agent/task` | any agent | Full task state, approvals, executions, verification |
| `POST /api/agent/execute` | Implementation (`github`), Design (`figma`) | Runs the fixture executor only if that exact operation has an unused approved approval |
| `POST /api/agent/verify` | QA | Independently re-reads both resources and finishes the task |
| `POST /api/agent/room-event` | any agent | Records an addressed Switch message (room id and message id) in agent activity |

Agents cannot approve. A human approves each operation in the dashboard (Issues & approvals). An approval is single use.

Run it: `npm run demo:reset:agents`, `npm run dev`, then on the **Integrations** page click **Copy chat-room template** and paste it into Switch Console to create the room (the agents' keys are inside it), and message the Director, for example `@mp-director fix the issues`. The fixture-only `npm run demo:reset` + `npm run demo:complete` path remains as a fallback that does not need Switch.

## Figma plugin

`figma-plugin/` (plain JavaScript, no build step) inspects the current page, requests a resource-bound approval, and applies only what the owner approved, then re-inspects and reports before/after. Backend routes live under `/api/plugin/*` and use `MARKPATH_PLUGIN_TOKEN`. **It is untested in Figma.** See `figma-plugin/README.md`.

## Connecting GitHub (real pull requests)

On **Integrations**, click **Connect GitHub**, open the link shown, and enter the code (GitHub device flow, so no callback URL or client secret). Then pick a repository, or click **Create a sample repo to try it**. The next audit reads that repository, and approved fixes open a real pull request. Markpath never merges and never writes to the default branch. QA then re-reads the pull request through the GitHub API and checks that only the intended files changed, the default branch is unchanged, and the pull request is open and unmerged. Without a connection the fixture path is used and labelled as a simulation.

Set `GITHUB_CLIENT_ID` in `.env.local` to your own GitHub OAuth app's Client ID (enable Device Flow when registering it). Tokens are stored encrypted on the server.

## Workspaces, chat approvals and the setup checklist

Sign up, create a workspace (optionally with the Nexa demo brand), and switch between workspaces from the header. Each workspace has its own agent keys, chat room, GitHub connection and history. On Integrations, **Copy chat-room template** gives the Switch Console template with that workspace's keys; it is stable across resets. The Director posts a one-click approval link and also accepts `@<director> approve` or `reject` from the workspace owner's chat handle (recorded as relayed through chat, not login-verified).
