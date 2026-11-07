---
name: markpath-design
description: Markpath's design language, motion, UX-writing and accessibility rules, with the Mobbin references behind them. Use for ANY Markpath UI work, including new or changed pages, components, layout, copy, motion, colour, dark mode, empty states, approval cards, setup steps, issue lists or activity feeds in src/app or src/components. Use it even for a one-line style or wording change.
---

# Markpath design system

Markpath is a calm control room for brand operations. Four agents (Director, Design, Implementation, QA) find off-brand values in GitHub, Figma and Canva. A person approves the exact change, the agents fix it and QA checks the result. The UI has three jobs: **show what is wrong, show exactly what will change, and prove it worked.** Show evidence, don't decorate.

## 1. Principles

1. **Values are the hero.** Hex values, font names and radii are the content. Show colour values with a swatch, use mono for raw values, and show changes as `from → to`.
2. **The decision comes first.** If something waits for approval, it is the first thing on the page, with a brand-tinted card and one primary action.
3. **Green means proven.** Use success colour only after Markpath has checked it. "Set up" uses neutral, not green.
4. **Dense but breathable.** Use Linear-style rows (44 to 56px) in cards. Group the rows and leave the background quiet.
5. **One primary action per region.** Everything else is secondary or ghost.
6. **Progressive disclosure.** Put technical details, places and earlier decisions behind `<details>`, using the shared disclosure style.

## 2. Tokens (defined in `src/app/globals.css`, exposed in `tailwind.config.ts`)

Colours are CSS variables. Dark mode overrides them under `@media (prefers-color-scheme: dark)`. Never hard-code Tailwind palette colours (`green-700`, `gray-*`) in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | #f6f7f9 | #0b0d12 | page background |
| `surface` | #ffffff | #12151c | cards, header |
| `subtle` | #f1f3f6 | #181c25 | group headers, inset wells, code |
| `ink` | #0f1729 | #e8ebf1 | body text |
| `muted` | #5b6474 | #9aa3b2 | secondary text (meets 4.5:1 on surface) |
| `border` | #e3e6eb | #232935 | hairlines |
| `border-strong` | #cdd3dc | #333b49 | inputs, secondary buttons |
| `brand` | #2457f5 | #8aa4ff | links, focus ring, active marks |
| `brand-solid` | #2457f5 | #3a66ff | primary button fill (white text) |
| `brand-soft` | #eef2ff | #18213d | approval card tint, selected chip |
| `success` / `-soft` | #157f3b / #e8f6ee | #4cd486 / #10261b | verified, done |
| `warning` / `-soft` | #9a5b00 / #fff4e0 | #f0b44c / #2a2010 | needs a person, medium |
| `danger` / `-soft` | #b42318 / #fdecea | #ff7a6e / #2c1413 | high priority, errors, reject hover |

- **Type:** Geist Sans (UI) and Geist Mono (values), loaded with `next/font/google` in `src/app/layout.tsx`. Scale: `text-xs` 12 (meta), `text-sm` 14 (UI default), `text-base` 16 (body), `text-lg` 18 (card titles), `text-xl` 20 (section), `text-2xl`/`text-[1.75rem]` (page title, `tracking-tight`). Weights: 400, 500 and 600 only. Use `tabular-nums` for counts and times, and `text-balance` on headings.
- **Spacing:** 4px base. Card padding 16 (`p-4`), or 20 on sm+. Section gap 40 (`mt-10`). Row gap 8 to 12.
- **Radius:** controls `rounded-control` (8px), cards `rounded-card` (12px), chips and badges `rounded-full`. Nested radius = outer minus padding.
- **Elevation:** `shadow-card` (hairline plus a 1px soft shadow) on cards. `shadow-pop` only for the open mobile menu. Dark mode uses borders instead of shadows.
- **Icons:** inline SVGs in `src/components/ui/icons.tsx`, 1.75 stroke, 16px in text and 20px in markers, always `aria-hidden`. Provider glyphs use the provider names (GitHub, Figma, Canva, chat). Use no emoji.

## 3. Components (`src/components/ui/`)

- **Button** `buttonClass(variant, size)`: `primary | secondary | ghost | danger`, sizes `md` (40px) and `sm` (36px, inline only, and still a 40px hit area via padding). Works on `<button>` and `<Link>`.
- **StatusBadge / Badge** `tone: neutral | brand | success | warning | danger`, with a 6px dot and text. Never use colour alone: the label always says the state.
- **Card**: surface, border, `rounded-card`, `shadow-card`. Use `CardRow` for list rows with a divider.
- **Approval card** (Wix "Review and approve", Replit "Ready for review"): `brand-soft` tint and a brand border. Header shows the agent avatar, the tool and a "Waiting for you" badge. Body shows the heading, the `from → to` change rows with swatches, and "what happens" in muted text. Footer has Approve (primary) and Reject (secondary). With several items, one "Approve all N" bar.
- **Issue group** (Linear grouped list): a group header in `subtle` (provider icon, name, count). Rows show rule name, `detected → expected` value pills, a severity badge and a "Show places" disclosure.
- **Setup step** (HoneyBook, Uxcel, Klaviyo checklists): a 32px numbered marker that becomes a success check, the title, a status badge, and a time chip ("About 10 minutes"). The page header has a progress bar ("4 of 5 done"). Done steps collapse to one "Working: evidence" line with Change.
- **Activity row** (incident.io timeline, Basecamp day groups): agent avatar on a vertical rail, "**Agent** did thing", a muted task line, and the time on the right with `tabular-nums`. Group by day.
- **Agent avatar**: a 28px rounded tile with initials and a per-agent hue (Director brand, Design violet, Implementation amber, QA green, person neutral).
- **Empty state** (Linear "No issues matching the filters"): a 40px icon in a `subtle` circle, a one-line title, one sentence of help and at most one action. With a filter applied, offer "Clear filters".
- **Metric tile**: a large `tabular-nums` value, the label below, and the whole tile as a link with a hover lift (border-strong only, no translate).
- **Swatch**: a 14px rounded square with an inset ring, shown wherever a value matches `#rgb`/`#rrggbb`.

## 4. Motion (from `motion-system`, mode **Subtle**)

Tokens: `--duration-xshort` 75ms, `-short` 150ms, `-normal` 250ms, `-slow` 400ms. Easing: `--ease-out-cubic`, `--ease-out-quart`, `--ease-in-cubic`, `--ease-in-out-cubic`. Tailwind: `duration-short ease-out-cubic`. Never write raw ms or cubic-bezier in components.

| Part | Category | Job | Duration | Easing | Notes |
|---|---|---|---|---|---|
| Button, link, chip hover | interaction | feedback | short | out-quad | colour and border only |
| Button press | interaction | feedback | xshort | out-cubic | `scale(.98)`, reversible transition |
| Focus ring | interaction | feedback | none | n/a | appears instantly |
| Page content entry | entry | orientation | normal | out-cubic | `.anim-rise` fade plus 4px rise, once per navigation, no stagger |
| Disclosure open | entry | orientation | normal | out-cubic | content fades and rises 4px. Chevron rotates at short |
| Mobile menu open | entry | orientation | short | out-cubic | fade plus 4px. Closes instantly |
| Progress bar fill | state | feedback | slow | in-out-cubic | width via `transform: scaleX` |
| Status message / notice | entry | attention | normal | out-cubic | never auto-dismiss errors |
| Waiting spinner | persistent | feedback | n/a | linear | only while GitHub sign-in waits (progress, so allowed) |

Rules: animate only transform and opacity. Exits are instant or quicker than entries. Don't stagger lists (they are high frequency). Use no infinite decorative loops. Under `prefers-reduced-motion: reduce`, the global block in `globals.css` sets `--motion-rise: 0` and `--motion-press: 1`, so everything becomes an opacity fade at `duration-short`.

## 5. UX writing (from `ux-writing`)

- Use sentence case everywhere, including buttons, headings and badges. Don't use Title Case.
- Write plain words for a brand owner. Never put MCP, fixture, enum, payload, slug, token (meaning a secret), webhook or raw IDs in visible text. Say "the Figma connector", "the built-in sample" and "agent key". Raw values belong in a "Technical details" disclosure.
- Name the action on the button: "Approve 3 changes", "Reject", "Save file", "Check again". Don't write "OK", "Submit" or "Click here".
- Statuses are states, not adjectives: "Waiting for you", "Approved", "Verified", "Needs a person", "Not connected".
- Empty states say what will appear and how to get it, in one or two sentences.
- Errors say what happened and what to do, without blame or exclamation marks.
- Don't change copy that comes from `src/lib/labels.ts` or `src/server`. Change only strings that live in pages and components.

## 6. Accessibility (from `better-accessibility`)

- Keep the skip link first in `(app)/layout.tsx`, targeting `#content` (`tabIndex=-1`).
- Nav links use `aria-current="page"`, and filter chips use `aria-current` too.
- Every input has a visible `<label>`. Help text uses `aria-describedby` where it is an input's help. Errors use `role="alert"` and status updates use `role="status"`.
- The focus ring is `outline 2px brand, offset 2px` (global `:focus-visible`) and is never removed.
- Hit areas are at least 40px (`min-h-10`). Inline text links get vertical padding.
- Text contrast is at least 4.5:1 and UI borders at least 3:1 for inputs. Check both themes.
- Layout reflows at 320px: no fixed widths, `min-w-0` on flex children, `overflow-wrap:anywhere` in `main`, and long values wrap.
- Decorative SVGs get `aria-hidden`. Status is never colour-only, because the badge text carries it.
- Headings go in order: one `h1` per page, then `h2` sections, then `h3` cards.

## 7. Mobbin references

| App | Screen | What Markpath borrows |
|---|---|---|
| Linear | [grouped issues](https://mobbin.com/screens/e142df2a-3527-499c-8f81-1b715947ac0c) | tinted group header with count, dense rows, right-aligned meta |
| Linear | [filtered empty](https://mobbin.com/screens/d3ab0127-662f-4764-9c84-511cd7345e27) | "No issues match" plus hidden count and Clear filters |
| Linear | [dark list](https://mobbin.com/screens/ed670cda-0527-4716-a1a6-0159f12c4f42) | dark tokens: lifted surface, low-contrast borders |
| Klaviyo | [review submission](https://mobbin.com/screens/02359910-64f7-4f23-8280-f1bf18c8e95f) | check rows with a status icon, a one-line reason and a right action |
| Klaviyo | [get started](https://mobbin.com/screens/5ce9e545-398b-48f8-a051-b92fbe30d704) | "3 / 3 completed" pill per setup group |
| HoneyBook | [step-by-step setup](https://mobbin.com/screens/7c915d6b-2a99-4eb0-956d-e7a3a97bb265) | progress bar in the header, time chip per step, check markers |
| Uxcel | [onboarding checklist](https://mobbin.com/screens/e364eaf2-50f2-4c3f-8a48-a83d31d0ab34) | done step explains you can still change it |
| Devin | [PR review](https://mobbin.com/screens/cc179f4b-bc86-4d08-bcac-a742d661aa29) | status strip ("Ready to merge") plus one primary action |
| Replit | [ready for review](https://mobbin.com/screens/e92dd0ec-6660-4610-930a-38900c351734) | agent result card with a summary and Cancel / Apply |
| Wix | [review and approve](https://mobbin.com/screens/35f261f5-eab7-4824-8575-661043bd2341) | per-item decision plus a bulk "Confirm (1/1)" |
| Customer.io | [approve / change](https://mobbin.com/screens/0dc4b8f3-bf9d-4169-932c-3da4a496b9c6) | paired approve and change buttons, a quiet empty state |
| incident.io | [activity timeline](https://mobbin.com/screens/f0f12826-61d2-4dd0-a57e-c84f3db62f88) | vertical rail with event icons and times |
| Basecamp | [latest activity](https://mobbin.com/screens/3119c9f0-832e-448d-b750-03e5a806e9f6) | group activity by day |
| Plane | [work item activity](https://mobbin.com/screens/cfddd1af-a701-4c3d-ad1c-b7f42e8c10fe) | one-line "actor verb object · time" events |
| Searchable | [brand resources](https://mobbin.com/screens/1ee4e9df-4418-4630-bada-ae9969ecd171) | colour rows: swatch, name, hex |
| AirOps | [brand kit](https://mobbin.com/screens/fa709db6-3eba-45ef-9170-0836b887fd26) | rule list with an "applies to" tag and versions |
| hilos | [workspace agents](https://mobbin.com/screens/ad00bad1-e623-4941-ba4f-82bc5aeb6043) | tinted agent identity tiles |

## 8. Guardrails when editing

- Change presentation only. Keep server actions, form `name`s, hidden inputs, routes and `src/lib`/`src/server` untouched.
- Use no new npm dependencies. Motion is CSS only.
- Check every change with `npx tsc --noEmit`, at 320px and desktop, in light and dark.
