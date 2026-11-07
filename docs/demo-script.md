# Demo script (about 3 minutes)

Before recording: rotate agent keys (Integrations → room template), reset the Figma and Canva files to their off-brand state (`docs/figma-test-file.md`, `docs/canva-test-design.md`), open the Switch room and the dashboard side by side.

| Time | Show | Say |
| --- | --- | --- |
| 0:00 | Overview + Brand profile | "Markpath keeps a company's approved brand rules and checks every place the brand lives: code, Figma, Canva." |
| 0:20 | Switch room | Four agents: Director, Design, Implementation, QA. Nothing happens until someone @mentions them. |
| 0:30 | Type `@mp-director fix the issues` | Plain words, no commands. |
| 0:45 | Design replies: Figma 16 + Canva 2 items, 1 needs a person | The agents read the real files through the Figma and Canva connectors. |
| 1:10 | Issues page: one approval card | Nothing changes until a person approves. The approval is tied to the exact file and change. |
| 1:25 | Reply `approve` in the room | Same approval, from chat. |
| 1:40 | Figma file and Canva design change live | Only colours, type and radii listed in the approval. |
| 2:00 | Real GitHub pull request, never merged | Implementation opens a branch and PR; the default branch is untouched. |
| 2:20 | QA re-reads everything independently | The agent that made the change does not mark its own work. QA reports; Markpath decides pass or fail from counts. |
| 2:40 | Reviews page + Activity | Link vetting, PR checks, scheduled audits, full audit trail. |
| 2:55 | Close | "Switch is the control room. Without it there is no coordination, no approvals in chat, no independent QA." |

Honesty notes to say out loud: Slack and Telegram are documented but not run; Canva cannot change fonts; the Figma/Canva edits run as the account connected to the agents.
