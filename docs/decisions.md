# Decisions

## 2026-11-06 — Local-first foundation

Use Next.js, TypeScript, Tailwind, direct `better-sqlite3`, and local-disk storage. A seeded email/password session provides a reproducible demo without an external dependency. The database columns and JSON text fields are portable to Postgres.

## 2026-11-06 — Resource-bound operations

Every consequential operation is represented by a stable SHA-256 fingerprint of its task, resource, operation name, and sorted payload. An approved record only authorizes that exact fingerprint. Task completion requires QA verification evidence for every required resource.

## 2026-11-06 — Deferred integrations

Docker, Switch Console, and a local Switch server are not installed or validated at foundation time. The backend is built locally first; Switch, GitHub, Figma, and Canva must display an honest unconnected state until each validation succeeds.

## 2026-11-06 — Switch code before live service

The room template, server-side agent token boundary, and Switch health interface are implemented and unit-tested. They are not evidence of a Switch connection. Live status remains `Not connected` until Docker, Console, local server, `/health`, and an addressed room reply are all validated.

## 2026-11-06 — Switch health validated, agent reply pending

The local Switch core service at `http://127.0.0.1:57888` returned `{"status":"ok"}` from `/health`. Markpath has this local base URL in ignored `.env.local` and can verify it through `/api/switch/health`. This is not enough to mark Switch as connected: a verified, addressed reply from the configured Markpath room is still required.

## 2026-11-06 — Live-server-safe demo reset

`demo:reset` clears Markpath tables in a SQLite transaction instead of deleting the SQLite file. Removing a file while Next's dev process held an open WAL caused a short-read I/O failure. The reset now preserves the active database file and removes only generated fixture workspaces and uploads before reseeding known demo records.
