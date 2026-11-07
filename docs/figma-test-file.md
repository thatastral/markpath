# Figma test file (deliberately off-brand)

File: https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt (key `kdLxaaGP6dR3ftXJpDCKjt`), page "Page 1", section "Nexa 1.0 design system (needs brand update)" (node `3:11`). Built through the Figma MCP (`use_figma`) on 2026-11-07, which also proved that MCP writes work on this account.

Approved Nexa 2.0 values: primary `#2457F5`, typeface Geist, button radius 8px.
Outdated values planted on purpose: primary `#164B9B`, typeface Inter, radius 4px.

| Where | Node | What is wrong |
| --- | --- | --- |
| Variable collection "Brand" | `color/primary` (`VariableID:3:3`) | `#164B9B` (the system itself is outdated; the Button is bound to it) |
| Variable | `radius/button` (`VariableID:3:6`) | 4 (the Button's corners are bound to it) |
| Text styles | `Heading/H1`, `Body/Base`, `Button/Label` | Inter |
| Paint style | `Brand/Primary` | `#164B9B` |
| Component `Button/Primary` | `3:12` | bound to the variables above, so fixing the variables fixes it |
| Component `Input/Default` | `3:14` | hard-coded radius 4 |
| Component `Card/Feature` | `3:16` | hard-coded radius 4; hard-coded accent bar `3:17` is `#164B9B`; title text is Inter Bold |
| Poster `Poster/Launch` | `3:20` | hard-coded `#164B9B` on the orb, logo square and tag bar; hard-coded radius 4 on logo and tag; Inter in the logo mark |

Expected after a correct brand fix: variables updated (which updates the Button and the poster's CTA), text styles switched to Geist, the hard-coded fills and radii updated, nothing else changed (layout, copy and sizes identical).

Account note: this account has a Full seat only in the "Dacoit" team (Pro). Its own teams are Starter with a View seat, so writes there would fail.

## Added 2026-11-07: a judgement item for the wider rules
The card's body copy ("Transfers settle instantly, with no hidden fees.") is `#98A2B3` on white, about 2.6:1, so it fails the 4.5:1 text contrast rule. It is reported as a "contrast" item that needs a person and is never auto-fixed. To reset it, set the text fill back to `#98A2B3` (it is not part of the brand colour fix).
