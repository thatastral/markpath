# Figma plugin guide (for `figma-plugin/`)

Written from general knowledge of the Figma Plugin API, not fetched today. Verify against the official docs before relying on a detail: https://developers.figma.com/docs/plugins/ (API reference: https://developers.figma.com/docs/plugins/api/api-reference/). It cannot be tested without Figma, so mark it "untested in Figma" in the README unless it was actually run.

## Project layout
```
figma-plugin/
  manifest.json
  src/code.ts      # runs in Figma's sandbox, has the `figma` API, no DOM, no fetch of arbitrary origins
  src/ui.html      # runs in an iframe, has DOM and fetch, no `figma` API
  package.json, tsconfig.json   # compile code.ts to dist/code.js, install @figma/plugin-typings
```

## manifest.json (minimal)
```json
{
  "name": "Markpath",
  "id": "000000000000000000",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "src/ui.html",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": { "allowedDomains": ["http://localhost:3000"], "reasoning": "Talks to the local Markpath backend." }
}
```
The `id` is assigned when the plugin is created in Figma (Plugins > Development > New plugin). Import it with Plugins > Development > Import plugin from manifest. With `documentAccess: "dynamic-page"`, use the async APIs (below) and load pages before reading them.

## Architecture
Two sandboxes that talk by messages:
- `code.ts`: `figma.showUI(__html__, { width: 360, height: 520 })`, then `figma.ui.onmessage = msg => ...` and `figma.ui.postMessage(data)`.
- `ui.html`: `parent.postMessage({ pluginMessage: { type, ... } }, "*")` to send, `window.onmessage = e => e.data.pluginMessage` to receive. All HTTP to the Markpath backend happens here with `fetch`, because the sandbox side cannot do general network calls.

## Reading the active file
- Current file: `figma.root` (document), `figma.currentPage`, `figma.fileKey` is only available to private plugins, so also let the user paste the file key.
- Find nodes: `figma.currentPage.findAll(n => ...)`. Types to check: `FRAME`, `COMPONENT`, `INSTANCE`, `TEXT`, `RECTANGLE`.
- Fills: `node.fills` is read-only and may be `figma.mixed`. A solid fill is `{ type: "SOLID", color: {r,g,b} (0..1), opacity? }`. Convert to and from hex carefully (`Math.round(v*255)`).
- Styles: `await figma.getLocalPaintStylesAsync()`, `await figma.getLocalTextStylesAsync()`.
- Variables: `await figma.variables.getLocalVariablesAsync("COLOR")`, `await figma.variables.getLocalVariableCollectionsAsync()`. A variable's value per mode is in `variable.valuesByMode`.
- Text: `node.fontName` (may be `figma.mixed`), `node.fontSize`, `node.characters`.

## Writing (only after an approval is passed in from the Markpath backend)
- Colour fill: `node.fills = [{ type: "SOLID", color: {r,g,b} }]` (assign a new array; the old one is immutable).
- Paint style: `style.paints = [...]`.
- Variable: `variable.setValueForMode(modeId, {r,g,b,a})`. May fail on plans or files without Variables write access: catch and report as unsupported.
- Text: you must `await figma.loadFontAsync(node.fontName)` before changing `characters` or font, and load the target font (for example Geist) before setting `node.fontName = { family: "Geist", style: "Regular" }`. If the font is not available, report it, do not guess.
- Make the edit, then re-read the same nodes by id and return before/after values as verification evidence. Never report success from the write call alone.

## Message protocol with Markpath
- UI asks the backend for the approved brand spec (`GET /api/plugin/spec`), sends it to the sandbox, which inspects and replies with findings `{nodeId, nodeName, page, property, detected, expected}`.
- UI posts findings to the backend (`POST /api/plugin/findings`).
- Plugin applies only operations the backend returns as approved (`GET /api/plugin/approved-operations`), each carrying an approval id. The plugin refuses anything without one.
- After applying, the plugin re-inspects and posts `{approvalId, operation, before, after, verified}` to `POST /api/plugin/execution`.
- Authenticate with a short-lived plugin token the user pastes into the UI. Never embed secrets in the plugin source.

## Limits to state honestly in the README
Runs only while the user has the plugin open on the active file. Cannot touch other files. Some properties are not exposed. Variables write may be unavailable. Fonts must exist in the file or user's account.
