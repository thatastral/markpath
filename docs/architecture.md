# Architecture

The Next.js App Router application owns the dashboard and typed server boundary. `src/server/` owns SQLite access, authentication, task orchestration, integration adapters, fixture executors, independent QA, and agent tool routes. Browser components do not receive integration credentials.

SQLite stores the PRD core entities: brands, users, memberships, integrations, resources, findings, tasks, approvals, execution records, and agent activity, plus versioned brand specifications and task-resource verification records. The Switch adapter sits behind a `SwitchClient` interface; a real room handoff must be recorded with its message reference in `agent_activity`.
