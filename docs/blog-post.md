# I gave my brand guidelines a team of agents (and made them ask permission)

Brand drift is boring and constant: a button the wrong blue in Figma, an old hex in a pull request, a Canva poster nobody updated. Markpath is my attempt at fixing that with Switch.

**The idea.** One approved brand spec. Four agents in a Switch room: a Director who plans, a Design agent that edits Figma and Canva through their connectors, an Implementation agent that opens real GitHub pull requests, and a QA agent that checks the work independently.

**What Switch gave me.** Rooms and @mentions made the handoffs visible: you can read the whole job in the chat. I also moved the agents' instructions to the server, so changing the workflow never means rebuilding the room.

**Approvals.** Agents act only when mentioned, and nothing is changed until a person approves the exact change. You can approve on a dashboard, a link, or by replying "approve" in the room. Approvals are single use and tied to the file and the change.

**Independent QA.** The agent that edited never grades itself. QA re-reads the real Figma file, Canva design and pull request; Markpath decides pass or fail from the counts, and judgement items (contrast, voice, logo) are flagged for a person, never auto-fixed.

**What went wrong.** Agents hit a usage limit mid-build, the room template silently ignored placeholders, and approvals from chat arrived as the generic sender "user". Each led to a design decision: server-owned playbooks, a stable template, and honest labelling of relayed approvals.

**What is next.** Slack and Telegram, a hosted agent machine, per-person Canva. Repo: github.com/thatastral/markpath #HowISwitch
