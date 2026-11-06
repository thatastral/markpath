# Markpath: instructions for Codex

This folder (`hackathons/switch/Markpath/`) is the project root. Build everything inside it: app, `docs/`, `fixtures/`, `figma-plugin/`, `README.md`.

Before writing any code, read in this order:
1. `CODEX_INSTRUCTIONS.md`: build order, decisions already made, rules. It overrides the PRD where they differ.
2. `Markpath.md`: the product requirements.

Guides in `guides/` (use them instead of looking for external skills):
- `guides/writing-plans.md`: the planning step. Short plan per slice, no extra approval stops.
- `guides/switch-rooms-integration.md`: Switch setup, template YAML, WebSocket agent protocol, how Markpath uses it (slice 7).
- `guides/figma-plugin-guide.md`: Figma plugin structure, API calls and the message protocol (`figma-plugin/`).

Start with slice 1 of the build order. Do not ask questions that CODEX_INSTRUCTIONS.md already answers. Report at the stop points it lists.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
