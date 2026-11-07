# Retrospective (2026-11-07, submission day)

## What worked
- Server-owned playbooks: changing what the agents do never needed a new Switch room.
- Resource-bound, single-use approvals made "approve by replying in chat" safe enough to ship.
- Independent QA: the agent that edits never grades itself; Markpath decides from counts.
- Using the official Figma and Canva MCP connectors instead of building OAuth apps.
- An end-to-end audit agent (`docs/e2e-audit.md`) found 44 issues that feature-by-feature checks missed.

## What went wrong, and what we changed
- The build agent ran out of usage mid-build; Claude finished the backend and frontend.
- Switch did not substitute `{team}` in instructions, so the agent-name prefix moved to the server.
- Re-issuing agent keys on every template copy broke running agents; keys are now stable until rotated.
- Chat approvals arrived from a generic "user"; the sole owner is recognised and the approval is labelled relayed.
- The Design agent skipped Canva twice: first the connector was not loaded in its session, then the Director kept a Figma-only task open. The server now reports `missingDesignAudits` and the playbook requires both audits.
- Sign-up failed only in production: the remote Turso protocol dropped named SQL parameters. Local SQLite never showed it. Lesson: test writes against the hosted database before calling it done.
- Standard details (forgot password, show-password eye, bound labels) were missed until a checklist-based audit. Lesson: audit against a standard product checklist, not only the brief.

## Known limits at submission
- Slack, Discord, Telegram and Teams are documented from Switch's docs; Telegram was set up by hand and is slow (BotFather, group, Switch, linking). One-click "Add to Slack/Discord/Telegram" needs Markpath- or Switch-owned bots and hosted agents.
- Password reset email needs a verified sending domain in Resend.
- Agents run on the owner's machine; they stop when it sleeps.
- Canva edits colours and wording, not fonts, and runs as one connected Canva account. Figma writes need a Full seat.
- Figma and Canva issue links open the file, not the exact layer.

## Next
1. One-click chat install (hosted bots) and hosted agents.
2. Per-person Canva connections.
3. Roles beyond owner and member.
