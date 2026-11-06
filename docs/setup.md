# Local setup

## Application

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local` and replace `MARKPATH_SESSION_SECRET` for non-local work.
3. Run `npm install`.
4. Run `npm run db:seed`.
5. Run `npm run dev`, then open `http://localhost:3000`.
6. Sign in with `demo@markpath.local` / `markpath-demo`.

Run `npm test`, `npm run typecheck`, and `npm run build` before handoff. `npm run demo:reset` resets the database, uploads, and local fixture workspace, then stages Nexa findings and approval decisions. After approving both proposed operations in the dashboard, `npm run demo:complete` runs the local fixture executor and independent QA.

## Switch Rooms

Docker Desktop and Switch Console must be installed first. In Switch Console, add a local server and confirm it is started, sign into the bundled Mattermost app, then replace any previously saved Markpath template YAML with the full contents of `switch/markpath-ops.template.yaml`. Existing Console template cards retain old YAML, so clicking an old card will not pick up a repository edit. The first local server start downloads several gigabytes. Set `SWITCH_BASE_URL` and a server-side `MARKPATH_AGENT_TOKEN`; use it only from agents calling `/api/agent/*`.

The current app must not be represented as Switch-connected until it passes `/health` **and** receives a verified agent reply from the configured room. Agents should act only on Switch WebSocket events whose `payload.addressed` is true, reply to the 2-second pings within the 6-second deadline, and record room message references in Markpath activity records.
