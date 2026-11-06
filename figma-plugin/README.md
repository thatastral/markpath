# Markpath Figma plugin (UNTESTED IN FIGMA)

Written against the Figma Plugin API from documentation. It has not been run inside Figma yet; treat it as untested until you do the steps below.

## Load it
1. Figma desktop app > Plugins > Development > Import plugin from manifest > choose `manifest.json` in this folder.
2. Start Markpath (`npm run dev`). In the dashboard go to Integrations, Figma, and click **Copy plugin key**, then paste it into the plugin.
3. Open a Figma file that uses `#164B9B`, Inter or a 4 radius, and run Plugins > Development > Markpath.

## Flow
1. **Inspect page** loads the approved brand rules, scans the current page (solid fills, text fonts, corner radius, local colour variables) and posts the result to Markpath.
2. **Request approval** creates a resource-bound approval in the dashboard (Issues & approvals).
3. The workspace owner approves it in the dashboard.
4. **Apply approved** changes only what the approval covers, re-inspects the page, and reports before/after counts. Markpath records it as "reported by the Figma plugin", not as QA-verified.

## Limits
Current page only. Needs the Figma desktop app open. Variable writes can fail on some plans; fonts (for example Geist) must be available. `devAllowedDomains` lets the plugin reach `http://localhost:3000` in development; a hosted Markpath would need its domain added to `allowedDomains`. Verify manifest field names against https://developers.figma.com/docs/plugins/manifest/ before publishing.
