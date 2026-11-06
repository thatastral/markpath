# Markpath foundation design

**Status:** approved for planning

## Scope

This document covers build slice 1 only: the runnable application foundation.
It intentionally excludes the brand-spec workflow, task state machine, audits,
executors, Switch wiring, dashboard feature pages, and Canva.

## Objectives

- Start a strict TypeScript Next.js application locally with no external service
  dependency.
- Persist the core Markpath records in local SQLite using `better-sqlite3`.
- Provide a seeded email-and-password demo session flow.
- Establish server-side boundaries that later slices can use without placing
  business logic in UI components.
- Document a reproducible local setup, including the deferred Switch setup.

## Architecture

The project will be one Next.js App Router application. `src/app/` contains
thin pages and route handlers. `src/components/` contains reusable presentational
UI. `src/server/` owns database initialization, typed repositories, auth, seed
data, and future integration adapters.

SQLite is stored on local disk and initialized through an idempotent schema
initializer. The schema uses portable column names and JSON text fields where a
future Postgres migration needs structured data. No integration credential is
stored in ordinary integration records.

## Data model

Slice 1 creates tables for all records named in PRD section 15: `brands`,
`users`, `memberships`, `integrations`, `resources`, `findings`, `tasks`,
`approvals`, `execution_records`, and `agent_activity`. Foreign keys and indexes
support workspace-scoped retrieval. The slice does not yet implement task
transitions, approval authorization, audit findings, execution, or verification.

## Authentication

The seed creates a Nexa demo workspace, one owner user, and an email/password
credential whose password is securely hashed. Login validates input with Zod,
verifies the password server-side, and creates an HTTP-only signed session.
Protected application routes require that session. The demo credential is
documented for local development only and is not a production default.

## Seed and fixtures

The seed is idempotent and produces only transparent demo data: Nexa, its owner
membership, integration placeholders marked `not_connected`, and no fabricated
connection success. Fixture repositories and Figma snapshots are established in
their dedicated slice when scanners are added; the foundation only creates the
directory structure and records this scope in documentation.

## Error handling and safety

All route/server inputs are Zod-validated. Database initialization and seed
failures produce explicit server errors. UI pages include loading, empty, and
error states as they are introduced. The foundation makes no external calls and
does not present Switch, GitHub, Figma, or Canva as connected.

## Verification

The foundation plan will add tests for schema initialization, repeatable seed
behavior, and successful/rejected authentication. It will also verify that a
fresh checkout can install dependencies, create the local database, seed it,
and start the app. Switch Console and Docker are explicitly untested until their
downloads and configuration have completed.

## Documentation

Slice 1 starts the required `docs/` set: overview, architecture, setup,
decisions, demo script, submission, retrospective, progress, and the later
review checklist. `docs/setup.md` includes the documented Switch setup steps
but makes clear they have not yet been executed or validated.

## Deliberate exclusions

- No Switch server, room, agent, or agent-to-agent handoff yet.
- No real GitHub, Figma, or Canva connection.
- No claim that a Figma plugin has been tested in Figma.
- No automatic or simulated execution presented as a real third-party change.
