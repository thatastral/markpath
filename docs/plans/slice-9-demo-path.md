# Slice 9: demo path

Goal: a repeatable local Nexa workflow stages, approves, executes, and independently verifies fixture brand corrections.

Done when:
- `npm run demo:reset` removes only demo-owned working data and stages findings plus exact pending approvals.
- `npm run demo:complete` refuses before dashboard approvals and completes only after both resource-bound approvals exist.
- The demo script explains dashboard, fixture, QA, and Switch boundaries accurately.
- README documents clean-clone setup and the real-versus-fixture matrix.
- Typecheck, tests, and production build pass.

Files: demo workflow and CLI; package scripts; README; setup and demo docs; progress log.

Steps:
1. Build a deterministic reset that seeds an approved fixture specification, resources, findings, and pending exact approvals.
2. Build a completion command that relies on existing approval guards, fixture executors, and independent QA.
3. Document the visible dashboard and Switch steps, run the complete fixture story, then commit.

Tests: existing approval/executor/QA tests; reset-and-complete CLI checks; TypeScript and production build.

Risks / stubs: the completion command is a local fixture workflow, not a GitHub PR or Figma API write. Switch coordination stays pending until a real agent reply is recorded.
