# Demo script

1. Run `npm run demo:reset`. It creates the Nexa user and workspace, approves the source fixture specification, scans the GitHub-style and Figma-style fixtures, and stages six confirmed findings plus two pending exact approvals.
2. Start `npm run dev`, sign in as `demo@markpath.local` / `markpath-demo`, and show the Overview counts. Explain that they are records, not an invented health score.
3. Show Brand profile with its approved, source-linked Nexa 2.0 rules.
4. Open Issues & approvals. Compare detected and expected values. Approve the two resource-bound operations. An approval cannot authorize a changed payload or another resource.
5. Run `npm run demo:complete`. It refuses unless both prior decisions are `approved`; it creates a local feature branch and commit for the code fixture, edits the Figma JSON fixture, then runs independent QA.
6. Refresh Agent activity and Issues & approvals. Explain that completion is recorded only after QA checks the expected values, absence of legacy values, and Git diff scope.
7. In Switch Console, with the local server running, import the checked-in room template and create the room. Show real addressed `@markpath-director` delegation and the agent's reply only after it is actually received. Do not call this complete until the room reference is visible in Markpath activity.

Fixture correction evidence is local. It is not a GitHub pull request, real Figma edit, or evidence of a Switch room reply.
