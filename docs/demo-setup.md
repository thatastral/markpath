# Demo setup: everything you need, in order

Use the live site: https://markpath.vercel.app

| What | Use this |
| --- | --- |
| Brand guideline (Markdown) | Download https://raw.githubusercontent.com/thatastral/markpath/main/fixtures/nexa-brand-guidelines.md and upload it in step 1 |
| Brand values it gives | Primary `#2457F5`, typeface Geist, button radius 8px. Old values: `#164B9B`, Inter, 4px |
| GitHub repository | `thatastral/markpath-nexa-demo-23f7` (or "Create a sample repository" in the GitHub step) |
| Figma file | https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt (in the Dacoit team, which has the Full seat) |
| Canva design | https://www.canva.com/design/DAHaL7l9y7c |
| Figma and Canva sign-in for the agents | https://claude.ai/settings/connectors on the computer running Switch Console |
| Chat | Switch Console with the bundled Mattermost, or Telegram (the only tested chat apps) |

## Before recording
1. Reset Figma and Canva to their off-brand state (see `figma-test-file.md` and `canva-test-design.md`, or ask me to reset them).
2. On Integrations, select **Make new keys**, then copy the room template again and recreate the room, so no old key appears on screen.
3. In GitHub, close any open Markpath pull requests on the demo repository.

## Full check (also your demo path)
1. Sign up → create a workspace → step 1: upload the guideline → check values → Save.
2. Logo (optional) → GitHub → paste the Figma and Canva links → chat room: name agents `mp`, copy the template, create the room in Switch Console, send `@mp-director what's the status?` → Check again turns green.
3. In the room: `@mp-director fix the issues`. Expect: Design reports Figma and Canva counts, Director posts one approval.
4. Reply `@mp-director approve`. Expect: Figma and Canva change, a GitHub pull request opens, Brand QA reports 0 old values.
5. Dashboard: Issues closes, Activity shows every step, Reviews shows checks.
6. `@mp-director is this on brand? https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt` → a read-only review on Reviews.

Note: the agents run in your Switch Console and call the live site. Copy the room template from the live site (not localhost) so they use the right address.
