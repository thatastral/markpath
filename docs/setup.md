# Local setup

## Application

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local` and replace `MARKPATH_SESSION_SECRET` for non-local work.
3. Run `npm install`.
4. Run `npm run db:seed`.
5. Run `npm run dev`, then open `http://localhost:3000`.
6. Sign in with `demo@markpath.local` / `markpath-demo`.

Run `npm test`, `npm run typecheck`, and `npm run build` before handoff. `npm run demo:reset` rebuilds the local demo database; later slices extend it to reset fixture resources.

## Switch Rooms (not yet validated)

Docker Desktop and Switch Console must be installed first. In Switch Console, add a local server, start it, sign into the bundled Mattermost app, and create the Markpath agent/room template from `switch/markpath-ops.template.yaml` when that slice is available. The first local server start downloads several gigabytes. The current app must not be represented as Switch-connected until it passes `/health` and receives a verified agent reply in the configured room.
