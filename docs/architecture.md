# Architecture

The Next.js App Router application owns the dashboard and typed server boundary. `src/server/` owns SQLite access, authentication, task orchestration, integration adapters, and future agent tool routes. Browser components do not receive integration credentials.

SQLite currently stores the PRD core entities: brands, users, memberships, integrations, resources, findings, tasks, approvals, execution records, and agent activity. The planned Switch adapter will sit behind a `SwitchClient` interface and record real room handoffs in `agent_activity`.
