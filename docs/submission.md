# Submission kit (WeMakeDevs "Flip the Switch", deadline 2026-11-07 23:59 IST)

## Checklist
- [ ] Repo made public (it is private until the owner says so): https://github.com/thatastral/markpath
- [ ] Rotate agent keys and check no secret is committed (`git log -p | grep -i "mp_"`, `.env*` ignored)
- [x] README top section: what it is, 3-minute demo, how Switch is central
- [x] Live site: https://markpath.vercel.app
- [x] docs/: overview, architecture, setup, decisions, demo-script, submission, retrospective, e2e-audit
- [ ] Demo video recorded from `docs/demo-script.md`, uploaded, link added to README
- [ ] Blog post published (Best Blog prize): `docs/blog-post.md`
- [ ] #HowISwitch post published: `docs/social-post.md`
- [ ] Submission link / form: ask in the WeMakeDevs Discord where entries go (not confirmed)
- [ ] Notion tracker row: Status Submitted, Repo, Demo URL, Submission URL, Lessons Learned

## One-paragraph description
Markpath is an agentic brand-operations team. Four agents in a Switch room (Director, Design, Implementation, QA) detect off-brand values in code, Figma and Canva, ask a person to approve the exact change, correct it through the real tools, and have an independent agent verify. People talk to the agents in plain words and approve by replying in chat.

## Why Switch is central
Without Switch there are no agents to coordinate, no @mention handoffs, no chat approvals and no independent QA hand-off. The dashboard is only the record and the approval screen.

## Known limits (state them)
Slack, Telegram, Discord and Teams are documented from Switch's docs but untested live (Teams also needs a public HTTPS address and an admin). Canva MCP edits colours and wording, not fonts, and runs as one connected user. Figma writes need a Full seat. SQLite, single host.
