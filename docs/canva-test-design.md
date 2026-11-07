# Canva test design

Design: https://www.canva.com/design/DAHaL7l9y7c (a one-page "Safari" poster template, 794x1123). Edited through the Canva MCP on 2026-11-07 to plant deliberate off-brand values.

Approved Nexa 2.0 primary: `#2457F5`. Outdated primary: `#164B9B`.

| Element | Locator | Planted problem |
| --- | --- | --- |
| CTA pill (shape) | `PB9P5gGQbvzwx4J2-LBZ764wGnntTJpRz` | fill `#164B9B` (originally white) |
| Divider line | `PB9P5gGQbvzwx4J2-LBddfrTgcT6qsQsY` | stroke `#164B9B`, 4px (originally white, 2px) |
| "RESERVE NOW" text | `PB9P5gGQbvzwx4J2-LBQVnPGZ08vNNNjZ` | colour set to white so it reads on the blue pill (originally `#333c57`) |
| "www.reallygreatsite.com" | `PB9P5gGQbvzwx4J2-LBHjgWGjzFTHqSgS` | leftover template placeholder: reported for a person, never auto-changed |

Expected audit: colour 2, humanReview 1. After the approved fix: colour 0, humanReview 1 (the placeholder still needs a person).

To reset the demo: set the pill fill and line stroke back to `#164B9B` (stroke weight 4) with the Canva MCP `edit-design`.

Limits of the Canva MCP that Markpath states plainly: text edits can change colour, size, weight and wording but not the font family; each person signs in with their own Canva account (no service accounts); some features need a paid plan.
