# Decisions

## 2026-11-06 — Local-first foundation

Use Next.js, TypeScript, Tailwind, direct `better-sqlite3`, and local-disk storage. A seeded email/password session provides a reproducible demo without an external dependency. The database columns and JSON text fields are portable to Postgres.

## 2026-11-06 — Resource-bound operations

Every consequential operation is represented by a stable SHA-256 fingerprint of its task, resource, operation name, and sorted payload. An approved record only authorizes that exact fingerprint. Task completion requires QA verification evidence for every required resource.

## 2026-11-06 — Deferred integrations

Docker, Switch Console, and a local Switch server are not installed or validated at foundation time. The backend is built locally first; Switch, GitHub, Figma, and Canva must display an honest unconnected state until each validation succeeds.
