# Codex build instructions: Markpath (attach with Markpath.md)

You are building Markpath from scratch for the Flip the Switch hackathon. The attached PRD (Markpath.md) is the product spec. This file overrides it where they differ. Read both fully before writing code.

## Hard facts
- Submissions close **2026-11-07 23:59 IST**. You have roughly one day. Optimise for a demo that works end to end over breadth.
- Judging: (1) Switch is central and the project stops working without it, (2) someone can clone the repo and reproduce it, (3) creative and real impact, (4) README and demo video make Switch's role clear.
- Deliverables: public repo, README, demo video. A clean clone must run from the README.
- You own the backend, data model, integrations, agents and orchestration. Claude will later polish the frontend and review everything, so keep the UI functional and structurally clean, not pretty.

## Decisions already made (do not re-ask)
1. **Scope: full P0 from the PRD, in the priority order below.** Because time is tight, build in strict slices. Each slice must work end to end and be committed before the next starts. If a slice is blocked for more than about 45 minutes, stub it honestly, record it in `docs/decisions.md`, and move on.
2. **Switch is not set up.** Docker, Switch Console and the local server are not installed. First write `docs/setup.md` with the exact steps (docs: https://docs.switchagents.ai/switch-rooms/getting-started). Build and test the backend so it runs without Switch first, behind a `SwitchClient` interface, then wire Switch.
3. **No real test assets exist. Create fixtures:**
   - `fixtures/nexa-web/`: a small web repo (CSS variables, tailwind-style tokens, a logo reference) seeded with the old brand: primary `#164B9B`, font Inter, 4px button radius. New brand: `#2457F5`, Geist, 8px.
   - `fixtures/nexa-figma.json`: a Figma-like file snapshot (styles, variables, a text style, a logo node) containing the same old values.
   - `fixtures/nexa-brand-guidelines.pdf` (or `.md` if PDF generation costs time) describing the new brand.
4. **Stack:** Next.js + TypeScript + Tailwind + shadcn/ui, SQLite (better-sqlite3 or Drizzle) instead of Supabase, simple email+password session auth with a seeded demo user, local-disk file storage. Keep the schema portable to Postgres. No external service is required to run the app.
5. **Honesty rules from the PRD are binding:** never show an integration as connected unless validated; never mark a task COMPLETED without QA verification evidence; never present uncertain findings as confirmed.

## Real vs simulated: label everything
Every integration is an adapter with two modes, selected by env vars, and the dashboard must display the active mode on the Integrations page and on each execution record.
- **GitHub:** `real` mode uses a token or GitHub App (`GITHUB_TOKEN` or app credentials) against a repo the user names. `fixture` mode runs the same flow against a local git repo created from `fixtures/nexa-web/` (branch, commit, a PR record stored in the DB, labelled "local simulation, not a GitHub PR"). Never edit the default branch. Never merge.
- **Figma:** `real` mode uses the REST API with `FIGMA_TOKEN` and file key (read-only unless Variables write is permitted). `fixture` mode reads `fixtures/nexa-figma.json` and applies approved edits to a working copy, then re-reads it for verification. Also build the **Figma plugin** in `figma-plugin/` (manifest, code.ts, ui.html) that inspects the active file, shows detected vs expected, and applies one approved colour/text-style fix, talking to the Markpath API. We cannot test it without Figma, so mark it "untested in Figma" in the README unless it was actually run.
- **Canva:** P1. Build only if every other slice is done. Otherwise show it as "Not connected" with the documented eligibility note. Do not fake it.
- **LLM extraction of the PDF:** use the agent runtime or a configurable model key. If no key is present, fall back to a deterministic parser for the fixture guideline and label the result "fixture extraction".

## Build order (commit after each slice)
1. **Foundation:** Next.js app, SQLite schema from PRD section 15 (brands, users, memberships, integrations, resources, findings, tasks, approvals, execution_records, agent_activity), seed script, session auth, `docs/` files started.
2. **Brand spec:** workspace, brand profile, guideline upload, extraction to a versioned JSON spec with source references and an "extracted / manual / approved" status per rule, review and approve flow, version history.
3. **Task engine:** the state machine in PRD section 13 (including per-resource status and PARTIALLY_COMPLETED), idempotent operations, approval records tied to a specific resource and operation, audit log. Unit-test the state machine and the approval binding.
4. **Audit engines (deterministic):** GitHub/token scanner and Figma snapshot scanner that produce findings in the PRD structure (detected, expected, evidence, severity, confidence, classification confirmed / possible / needs review / compliant). Deterministic checks decide; the LLM only proposes and explains.
5. **Executors:** GitHub branch + commit + PR (real or fixture), Figma fixture edit. Each returns evidence. Executors refuse to run without a matching approved approval record.
6. **QA verifier:** an independent re-read of the resource after execution that checks the new value is present, the old value is gone, and no unrelated files changed (diff scope check). It writes the verification report. API success alone is never verification.
7. **Switch wiring (the core of the judging):** four agents (Brand Director, Design Agent, Implementation Agent, Brand QA) registered in Switch with distinct instructions, in one operations room. Agents call Markpath's backend through a small authenticated tool API (`/api/agent/*`: get brand spec, run audit, propose change, request approval, execute approved op, verify). Handoffs happen by real @mentions in the room. Prefer a Switch template YAML (see `examples/agent-templates/triage-pair.template.yaml` in sandbox-quantum/switch) so setup is reproducible. Note the protocol uses a WebSocket inbound connection (SSE is deprecated), a 2s ping with a 6s pong deadline, and agents act only when `payload.addressed` is true. New agents answer only their owner until `addressing` is updated.
8. **Dashboard (functional, five pages):** Overview, Brand Profile, Integrations (with true status states), Issues and Approvals (detected vs expected, approve/reject/request revision), Agent Activity. Also the onboarding steps from PRD 10.3. Plain shadcn components, no custom styling effort.
9. **Demo path:** a one-command script `npm run demo:reset` that reseeds fixtures, and a documented sequence that reproduces PRD section 20 end to end.
10. **P1/P2:** only if time remains: Canva, scheduled audits, webhooks.

## Frontend rules (so Claude can polish it later)
- All design values in one `src/styles/tokens.css` and `tailwind.config`; no hard-coded colours in components.
- UI components in `src/components/`, pages thin, all data through typed API routes or server functions in `src/server/`. No business logic in components.
- Every page needs loading, empty and error states, with real copy, not lorem ipsum.
- Do not spend time on animation, illustration or visual polish.

## Quality bar
- TypeScript strict. Validate all API input with zod. No secrets in the client, in chat messages, or in agent output. `.env.example` lists every variable.
- Tests: state machine, approval binding, both scanners against the fixtures, and the executor refusing unapproved operations. One end-to-end script runs the full fixture workflow without Switch.
- Do not claim anything works unless you ran it. When you finish a slice, run its tests and say what passed and what was not run.

## Documentation (required by the repo owner)
Maintain `docs/`: `overview.md`, `architecture.md`, `setup.md`, `decisions.md` (including every cut or stub and why), `demo-script.md`, `submission.md`, `retrospective.md`. The README must show clearly how Switch is used (rooms, agents, mentions, tool API), the real vs simulated matrix, and how to reproduce the demo from a clean clone. Keep `progress.md` as a dated log.

## Stop-and-report points
Report back (short, factual) after slices 3, 6, 7 and 9, stating: what runs, what was tested, what is simulated, and what is left. If something in the PRD conflicts with a decision above, follow this file and note the conflict in `docs/decisions.md`.

## Handoff to Claude (later)
Claude will (a) polish the five dashboard pages and the Figma plugin UI, (b) run a full code and security review, (c) check README reproducibility and the honesty rules. Leave a `docs/review-checklist.md` listing the files and flows you want reviewed first.
