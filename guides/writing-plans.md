# Writing plans (use this when a workflow asks for a "writing-plans" step)

Purpose: turn an approved design into a short, executable plan before coding. Keep it fast. This build has about 12 hours.

## Rules
- One plan per build slice (see CODEX_INSTRUCTIONS.md). Write it to `docs/plans/slice-<n>-<name>.md`. Maximum one page.
- Do not re-brainstorm decisions already made in CODEX_INSTRUCTIONS.md or AGENTS.md. Treat them as fixed.
- Do not stop for approval between plan and implementation unless a decision is genuinely ambiguous and blocks work. Write the assumption in the plan and continue.

## Plan template
```
# Slice <n>: <name>
Goal: one sentence, what works when this slice is done.
Done when: 3-6 checks that can be run (commands, tests, a visible behaviour).
Files: list of files to create or change.
Steps: ordered, each small enough to finish and test in under 30 minutes.
Tests: which tests prove it. Write the test before or with the code.
Risks / stubs: anything that will be simulated, and how it is labelled in the UI and docs.
```

## Execution rules
- Implement steps in order. Run the tests after each step. Commit after each passing slice with a message that names the slice.
- If a step fails twice, stop, write what failed and what you tried to `docs/decisions.md`, then stub it honestly and move on.
- Never mark a step done without running it. Report what ran and what did not.
- Update `progress.md` (dated log) at the end of each slice.
