# Slice 1: Foundation

Goal: a fresh clone can run a local Markpath app with a seeded, authenticated Nexa workspace and portable SQLite core schema.

Done when:
- `npm run db:seed` initializes and reseeds the local SQLite database.
- `npm test` verifies schema, seeds, and auth credentials.
- `npm run build` completes.
- The app has a working sign-in page and protected overview shell.
- Documentation identifies every integration as unconnected and explains local/Switch setup.

Files: project configuration, `src/app/`, `src/server/`, tests, `.env.example`, `docs/`, and the local data directory.

Steps:
1. Initialize the strict Next.js/Tailwind/test toolchain and environment contract.
2. Add SQLite schema initialization, typed repositories, and idempotent Nexa seed.
3. Add email/password session authentication and protected app shell.
4. Start required docs and run tests/build.

Tests: isolated SQLite schema/seed tests and credential/session signing tests.

Risks / stubs: Switch, Docker, GitHub, Figma, and Canva are not connected or simulated in this slice. The dashboard shows no successful integration state.
