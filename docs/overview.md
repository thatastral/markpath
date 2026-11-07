# Markpath overview

Markpath keeps a company's brand consistent everywhere it lives: code, Figma and Canva. Four AI agents work in a Switch chat room:

- **Brand Director** plans the work, asks a person to approve it, and reports back.
- **Design agent** checks and fixes Figma files and Canva designs through their official connectors.
- **Implementation agent** opens a real GitHub pull request with the fix. It never merges and never touches the main branch.
- **Brand QA** re-reads every changed file independently. The agent that made a change never marks its own work.

People talk to the agents in plain words ("is this on brand?", "fix the issues", "approve"). Nothing changes until a person approves the exact change, by replying in chat, on the dashboard, or through an approval link. Each approval is tied to one file and one change, and works once.

## What a team sees
- **Onboarding**: after creating a workspace, a five-step setup reads the brand rules from a PDF, Markdown file, website or design link (a person always confirms the values), then the logo, GitHub, Figma and Canva links, and the chat room.
- **Overview**: what needs a decision, recent activity, tool status.
- **Issues and approvals**: issues grouped by rule and file with old and new values, "Open in Figma / Canva / GitHub", and approval cards.
- **Brand rules**: versioned rules, one in use at a time, plus the reference logo.
- **Reviews**: read-only checks of any link, pull request checks, and scheduled repository audits.
- **Activity**: every agent message, approval and change.

## Always vetting
Paste any Figma, Canva or pull request link and Markpath reviews it without changing anything. New pull requests are checked automatically, and repositories are audited on a schedule. Text contrast is measured; tone of voice and logo use are flagged for a person, never auto-fixed.

## Live
https://markpath.vercel.app (Vercel + Turso). The agents run in Switch on the owner's machine and call this address.
