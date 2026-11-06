# Next tasks for Codex (from Claude's review, 2026-11-06 16:30 WAT)

Deadline: 2026-11-07 23:59 IST (19:29 WAT). Do these in order. Commit after each. Tell the owner what ran and what did not.

## Why: the judging risk
Judging criterion 1 is "Switch is central; the project stops working without it." Today the agents drive nothing: the only agent endpoint is `GET /api/agent/brand-spec`, and the demo completes through `npm run demo:complete`. The goal of tasks 1 to 3 is that **agents in the Switch room drive Detect -> Coordinate -> Correct -> Verify through Markpath's API**, with the CLI kept as a fallback.

## 1. Agent tool API (highest priority)
Add token-authenticated routes under `src/app/api/agent/` (same `hasValidAgentToken` check, zod validation, brand-scoped):
- `POST /audit` run the fixture audit for a brand, persist findings, create a task, move it to PLAN_READY. Idempotent by key.
- `GET /findings?taskId=` findings with evidence.
- `POST /approvals` request a resource-bound approval for a proposed operation (wraps `requestApproval`). Returns the approval id and the dashboard URL. Agents cannot decide approvals.
- `GET /approvals/:id` status (pending/approved/rejected).
- `POST /execute` runs the matching fixture executor only if `isApprovedOperation` passes; returns evidence.
- `POST /verify` runs the independent QA verifier, updates task resources, calls `finishVerification`, returns the report.
- `GET /tasks/:id` full state: per-resource status, approvals, execution records, verification.
Each call must take an `agent` header or body field (`director|design|implementation|qa`) and write it to `agent_activity` with the Switch message id if supplied (`message_reference`).
Tests: 401 without token, approval required before execute, verify refuses before execute, per-agent attribution recorded.

## 2. Per-agent identity and honest audit trail (review finding)
- One shared `MARKPATH_AGENT_TOKEN` means any agent can act as any other, and `appendActivity` hard-codes agent names (`updateTaskResource` logs "Brand QA", `requestApproval` and `decideApproval` log "Brand Director", and a human decision is logged as the Director). Use four tokens (`MARKPATH_AGENT_TOKEN_DIRECTOR`, `_DESIGN`, `_IMPLEMENTATION`, `_QA`), derive the agent name from the token, and log the real actor. Log human approvals as the user, not an agent.
- Enforce roles: only QA calls `/verify`; only Implementation runs the GitHub executor; only Design runs the Figma executor; only Director creates audits and requests approvals.
- Dashboard approval decisions (`decideApprovalForOwner`) should write an `agent_activity` row too.

## 3. Switch status honesty and room handoffs
- Add an endpoint the agents call when they post in the room (`POST /api/agent/room-event` with room id, Switch message id, sender, addressed mention) so `agent_activity` records real handoffs.
- Integrations page: show Switch "Connected" only when `/health` passes AND at least one agent reply was recorded via room-event. Otherwise show exactly what is missing.
- Update each agent's instructions in `switch/markpath-ops.template.yaml` so they call these API routes with their own token and quote the returned evidence. Agents must never claim a result the API did not return. Tell agents their base URL and where the token env var is, without putting secrets in the YAML.
- Keep `docs/setup.md` in sync: how to put the four tokens where the agents can read them.

## 4. Security fixes from review
- `src/server/auth/session.ts`: the session secret falls back to a hard-coded default. Fail closed in production (throw if `MARKPATH_SESSION_SECRET` is unset when `NODE_ENV=production`), and put an issued-at/expiry inside the signed value so old cookies stop working.
- Approvals are reusable: an approved approval can authorize repeated executions (the Figma fixture re-runs silently). Mark an approval consumed when executed and refuse a second use.
- `src/server/executors/fixture-executors.ts`: `replaceAll("4px","8px")` and `replaceAll("Inter","Geist")` are text-wide and would corrupt values such as `14px` or `Interface`. Replace only specific token declarations. Add a test with a decoy value.
- README: the demo password is public. Say the seed credentials are for local fixtures only and must not be used on a hosted deployment.
- Add `.nvmrc` / `engines.node` (the project was built on Node 24; the native `better-sqlite3` build breaks across Node ABI versions, so state the version and that `npm install` must run under it).

## 5. Figma plugin (after 1 to 4)
Create `figma-plugin/` per `guides/figma-plugin-guide.md`. Plugin endpoints under `/api/plugin/*` use a short-lived plugin token. Mark it "untested in Figma" in the README unless run.

## 6. Handoff to Claude
When 1 to 4 are done, append a note to `docs/review-checklist.md` listing the new files, then stop. Claude will run the dashboard polish and a second review.

## Verified by Claude (so you do not redo it)
Typecheck passes. 14 of 14 tests pass when `better-sqlite3` is rebuilt for the running Node version. `.gitignore` correctly excludes `.env.local`, the SQLite files, uploads and `node_modules`. The GitHub executor uses `execFileSync` with argument arrays (no shell). Approval binding by SHA-256 fingerprint over resource, operation and payload works as designed. Dashboard approvals are owner-only.
