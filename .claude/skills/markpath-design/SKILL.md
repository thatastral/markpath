---
name: markpath-design
description: Markpath's design language (Linear app shell and lists + AirOps cards and brand kit), tokens, motion, UX-writing and accessibility rules, with the Mobbin references behind them. Use for ANY Markpath UI work, including new or changed pages, components, layout, copy, motion, colour, theme, empty states, approval items, setup steps, issue lists or activity feeds in src/app or src/components. Use it even for a one-line style or wording change.
---

# Markpath design system

Markpath is a calm control room for brand operations. Four agents (Director, Design, Implementation, QA) find off-brand values in GitHub, Figma and Canva. A person approves the exact change, the agents fix it and QA checks the result. The UI has three jobs: **show what is wrong, show exactly what will change, and prove it worked.**

Direction (owner-picked): **Attio-calm overall** (warm light-grey sidebar, flush white canvas, small type, almost no colour, one accent), **Attio + Gumloop for Home**, **Langdock + Attio for Integrations/onboarding**, **incident.io for empty states and the 404**, with **Linear for lists and rows and AirOps for cards and the brand-kit table**. The app shell, navigation, lists, rows, and badges follow Linear: dense, monochrome, hairlines, one accent, keyboard-first. Overview, Brand and Integrations follow AirOps: a soft canvas, generous whitespace, rounded-xl cards with very light borders, friendly section headers and a brand-kit table with swatches.

## 1. Principles

1. **Values are the hero.** Hex values, font names and radii are the content. Colour values get a swatch, raw values use mono, changes read `from → to`.
2. **The decision comes first, quietly.** Pending approvals sit at the top of Issues and Overview, in a plain card with an accent left rule and one primary action. No glow, no tinted ring.
3. **Green means proven.** Success colour only after Markpath has checked it. Not started is grey, needs-you is the accent.
4. **Monochrome by default.** Colour appears only in status dots, status icons, severity icons, swatches and the one primary button per region. Text stays ink or muted.
5. **Fewer boxes.** Lists are rows with hairline dividers inside the panel, not cards inside cards. Only AirOps-style pages use cards.
6. **Progressive disclosure.** Technical details, places and earlier decisions go behind `<details>` with the shared chevron.

## 2. Tokens (`src/app/globals.css`, exposed in `tailwind.config.ts`)

**Light and dark themes.** Light is Attio-calm, dark is Linear-dark; every text pair meets WCAG AA in both. `<html data-theme="system|light|dark">` is rendered on the server from the `mp-theme` cookie (`src/app/layout.tsx`, `src/components/theme/`), so there is no flash. Tokens live on `:root` (light), `:root[data-theme="dark"]`, and `@media (prefers-color-scheme: dark) { :root[data-theme="system"] }`; each sets a matching `color-scheme`. Default is System (follows the OS). The `ThemeSwitcher` (System / Light / Dark radio group, arrow keys) sits in the sidebar account area and in the auth pages' footer. Tailwind `dark:` is wired to the same rule (`darkMode: ["variant", …]` in `tailwind.config.ts`); prefer tokens over `dark:`. Never hard-code Tailwind palette colours in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | #f8f8f7 (warm grey) | #0d0e10 | sidebar and auth background |
| `surface` | #ffffff | #151619 | the content panel, cards, menus |
| `subtle` | #fafaf9 | #1a1b1e | list group bands, wells, code |
| `hover` | #f0f0ee | #1f2024 | row and nav hover, selected nav item |
| `ink` | #1d1d1f | #e6e6e8 | primary text |
| `muted` | #6b6b6f | #9a9ca3 | secondary text, meta (4.5:1 on surface and canvas) |
| `faint` | #a3a3a0 | #62656c | icons and unfilled severity bars only, never text |
| `border` | #ececea | #232428 | hairlines |
| `border-strong` | #dededb | #303136 | inputs, secondary buttons |
| `brand` | #5e6ad2 | #8f97f2 | the single accent: links, focus ring, active marks |
| `brand-solid` | #5e6ad2 | #5e6ad2 | primary button fill (white text) |
| `brand-soft` | #eff0fb | #1e2036 | selected chip, needs-you step marker |
| `success` / `warning` / `danger` | #1f7a45 / #9a5800 / #c0322a | #5ec58a / #e5a84a / #f07a72 | status dots, icons, error text |
| `*-soft` | very light tints | very dark tints | only for inline error and value-diff pills |

- **Type:** Geist Sans for UI, Geist Mono for values (`next/font/google`, `src/app/layout.tsx`). The Tailwind scale is remapped to Linear's compact sizes: `text-2xs` 11, `text-xs` 12, `text-sm` **13 (UI default and body)**, `text-base` 14, `text-lg` 16, `text-xl` 18, `text-2xl` 22, `text-3xl` 26. Weights 400, 500 and 600 only. Headings use `tracking-tight`. Counts and times use `tabular-nums`. Inputs are 16px below `sm` so iOS does not zoom.
- **Spacing:** 4/8px grid only. Page body `px-4 sm:px-6 lg:px-8`, `py-6`. Card padding 20 (`p-5`). Section gap 32 (`mt-8`).
- **Radius:** `rounded-control` 6px (buttons, inputs, rows), `rounded-card` 12px (AirOps cards), `rounded-panel` 10px (the content panel). Badges `rounded-full`.
- **Elevation:** none in the page. `shadow-pop` only for the workspace menu and mobile drawer.
- **Icons:** one set, inline SVG in `src/components/ui/icons.tsx`: 24 viewBox drawn at 16px, **1.5 stroke**, round caps, monochrome (`text-muted` in nav, `currentColor` elsewhere). Always `aria-hidden`. No emoji, no icon fonts, no npm icon packs.
- **Provider marks:** `GithubIcon`, `FigmaIcon`, `CanvaIcon`, `SlackIcon`, `DiscordIcon`, `TelegramIcon`, `TeamsIcon` are simplified filled logos in `currentColor` (cut-outs use `var(--color-surface)`). Use them through `ProviderIcon provider="github|figma|canva|switch|slack|discord|telegram|teams"`. Keep them monochrome, like Linear's integration list.
- **Logo:** `Logo` in `src/components/main-nav.tsx`: an ink rounded tile with a path that ends in a point (the "mark" at the end of the "path"). Favicon/app icon: `src/app/icon.svg`, the same mark on the accent.

## 3. App shell (`src/app/(app)/layout.tsx`, `AppShell` in `src/components/header-menu.tsx`, `src/components/main-nav.tsx`)

- **Desktop (lg+):** a fixed 240px left sidebar on `canvas`. Top: the workspace switcher (8px-radius initial tile + workspace name + chevron) opening a menu of workspaces (each a submit button with `name="brandId"`) and "New workspace". Then the nav: Overview, Issues & approvals (with a count badge when approvals wait), Brand, Reviews, Activity, Integrations. Each item: 16px icon + label, 32px tall, `rounded-control`, hover `bg-hover`, current item `bg-hover text-ink font-medium` with `aria-current="page"`. Bottom: the account (initial tile, name, email) and Sign out.
- **Content canvas:** flush to the right of the sidebar (Attio): white `surface`, separated by one hairline `border-l`. No floating panel.
- **Getting started pill (Attio, Langdock):** while required setup steps remain, the sidebar bottom shows a small card "Getting started n/m", "x% done. Next: step" and a 4px progress bar, linking to Integrations. It disappears when setup is complete. The Switch health check behind it is capped at 800ms so it never slows a page.
- **Mobile (< lg):** a 48px sticky top bar on `surface` (logo, workspace name, Menu button). The menu opens the same sidebar as a left drawer with a scrim. Escape closes it and returns focus to the button; navigating closes it. One `<nav aria-label="Main">` only.
- **Page header bar:** every page starts with `PageHeader`: a slim bar with a hairline bottom border, `h1` at `text-base font-semibold`, a one-line `text-sm text-muted` description, and actions right-aligned. No eyebrows.
- **Skip link** first in the layout, targeting `#content` (`tabIndex=-1`).

## 4. Patterns (`src/components/ui/`)

- **Button** `buttonClass(variant, size)`: `primary | secondary | ghost | danger`. `md` is 32px on desktop, `sm` 28px; both are 40px below `lg` (touch). 13px medium text, `rounded-control`.
- **Badge** `tone: neutral | brand | success | warning | danger`: Linear pill. Hairline border, surface fill, 12px text, a 6px coloured dot. The text always carries the meaning.
- **Row / list (Linear):** `ListGroup` = a full-width group band (`bg-subtle`, 32px, icon + name + count in muted) followed by rows. A row is 36px min (40px on touch), `px-4 sm:px-6`, hairline divider, `hover:bg-hover`. Left: status or severity icon. Middle: title (ink, 13px medium) then muted context. Right: meta (badges, time) right-aligned, `tabular-nums`.
- **Severity icon:** Linear priority bars (1 to 3 filled bars), `faint` for unfilled. High and critical use `danger`.
- **Status icon:** Linear circles. Done/verified = filled check circle (success). Needs changes = circle with a filled half (danger). Needs a person = dashed circle (warning). Waiting = accent circle with a dot.
- **Approval item:** a `surface` card with a 2px accent left rule, header line "Brand Director asked for approval" + "Waiting for you" badge, heading, `ChangeList`, muted "what happens", and Approve (primary) + Reject (secondary). Several items get one "Approve all N" footer.
- **Card (AirOps):** `rounded-card border border-border bg-surface`, no shadow, `p-5`. Section header outside the card: `text-base font-semibold` + one muted line, actions right.
- **Brand-kit table (AirOps):** a bordered card with a header row (`text-xs text-muted`: Rule, Value, Source) and rows: label, a 20px swatch + mono value, source. Stacks to two lines below `sm`.
- **Setup stepper:** an `<ol>` in one card. Each step is a row: a 24px marker (number, accent ring when it needs you, success check when done), title + status badge, time on the right. The step that needs you expands to show why, what you'll need and its actions. Done steps collapse to "Working: evidence" with a Change disclosure.
- **Activity row:** 20px agent avatar, "**Agent** did thing", a muted task line, and the time right-aligned. Grouped by day with a group band.
- **Empty state (incident.io):** `EmptyState` renders `EmptyArt`, a small mock of three stacked rows with the icon on the front row, then a 13px semibold title, one muted line and up to two buttons (primary first). Filtered: "Clear filters". The 404 uses `EmptyArt` with a "404" label.
- **Home / Overview (Attio home, Gumloop home):** header bar "Overview", then a centred max-w-3xl column: a 22px greeting ("Good afternoon, Ada."), a one-line stat strip of links ("20 open issues · 8 high priority · ..."), then sections in order: **Needs your decision** (rows linking to the approve page, or a quiet one-line card when empty), **Finish setting up** (only while setup is incomplete), **Recent activity**, **Your tools** (two-column small cards with a status dot).
- **Integrations (Langdock grid, Attio connect):** "Your tools" card grid (icon tile, title, two-line why, status badge, Connect/Set up/Manage button jumping to the step) with filter chips All / Connected / Needs setup (`?show=`), then the full step-by-step stepper below. Statuses and step logic are unchanged.
- **Sidebar collapse (desktop):** the Collapse button at the bottom of the sidebar (or `[`) shrinks it to a 56px icon rail; labels become screen-reader-only (`.sb-text`), extras hide (`.sb-hide`), nav items keep a `title` tooltip. Saved in the `mp-sidebar` cookie and rendered on the server. No animation (it is a frequent, keyboard-friendly action).
- **Forms (Stripe/Linear/Vercel sign-in pattern):** `Field` in `src/components/ui/form-field.tsx`: visible label bound with `htmlFor`/`id`, hint below, inline error with an alert icon wired by `aria-describedby` + `aria-invalid`, checked on submit with focus moved to the first problem (no browser bubbles). Correct `autocomplete` (`name`, `email`, `organization`, `current-password`, `new-password`, `url`). `PasswordInput` has a show/hide eye button (`aria-label` Show/Hide password, `aria-pressed`, focus stays in the field) and a Caps Lock hint. Login has a right-aligned "Forgot password?" link. Every submit uses `SubmitButton` (pending label, no width change).
- **Files and links:** `FileDrop` (`src/components/ui/file-drop.tsx`) is a dashed drop zone: drag a file in or click to browse, shows the chosen file name and size, checks type and size before upload; the real file input stays in the form. `UrlInput` accepts links with or without `https://`, checks the host (Figma, Canva) and shows the error inline.
- **Swatch:** a rounded square with an inset hairline ring wherever a value matches `#rgb`/`#rrggbb`.
- **Auth and single-purpose pages:** login and signup use `AuthFrame` (`src/components/auth-frame.tsx`): a centred 360px column on `canvas`, the logo above, a plain `surface` card with a hairline border, labels in 12px muted. No gradients. The 404 is the same centred column without a card. New workspace and the approve link page live inside the shell: header bar, then a narrow centred card column (max-w-md / max-w-2xl).

## 5. Motion (from `motion-system`, mode **Subtle**)

Tokens: `--duration-xshort` 75ms, `-short` 150ms, `-normal` 250ms, `-slow` 400ms. Easing: `--ease-out-quad`, `--ease-out-cubic`, `--ease-in-out-cubic`. Tailwind: `duration-short ease-out-cubic`. Never write raw ms or cubic-bezier in components.

| Part | Duration | Easing | Notes |
|---|---|---|---|
| Row, nav, button hover | xshort | out-quad | background and colour only |
| Button press | xshort | out-cubic | `scale(.98)` |
| Focus ring | none | n/a | instant |
| Page content entry | normal | out-cubic | `.anim-rise`: fade + 4px rise, once per navigation |
| Disclosure open | normal | out-cubic | content fades and rises 4px; chevron rotates at short |
| Workspace menu, mobile drawer | short | out-cubic | fade + 4px (menu) or 8px slide (drawer); closes instantly |
| Progress bar | slow | in-out-cubic | `transform: scaleX` |

Animate only transform and opacity. No stagger on lists, no loops except the GitHub sign-in spinner. Under `prefers-reduced-motion: reduce` amplitudes are zeroed so everything becomes a short fade.

## 6. UX writing (from `ux-writing`)

- Sentence case everywhere. Plain words for a brand owner: never MCP, fixture, enum, payload, slug or raw IDs in visible text (raw values go in "Technical details").
- Buttons name the action: "Approve 3 changes", "Reject", "Save file", "Check again".
- Statuses are states: "Waiting for you", "Approved", "Verified", "Needs a person", "Not connected".
- Empty states say what will appear and how to get it. Errors say what happened and what to do.
- Don't change copy from `src/lib/labels.ts` or `src/server`.

## 7. Accessibility

- Skip link first; nav and filter chips use `aria-current`; every input has a visible label; errors `role="alert"`, updates `role="status"`.
- Focus ring: `outline 2px brand, offset 2px`, global, never removed.
- Hit areas at least 40px below `lg` (touch). Desktop rows and buttons may be 32px.
- Contrast 4.5:1 for text in both themes (`faint` is never text). Status is never colour-only.
- Reflow at 320px: `min-w-0` on flex children, long values wrap, no fixed widths.
- One `h1` per page (in the header bar), then `h2`, then `h3`.

## 8. Mobbin references

**Owner-picked (primary):**

| App | Reference | What Markpath takes |
|---|---|---|---|
| Attio | [home](https://mobbin.com/screens/4adb35f8-087c-4123-90f1-da4620dbe159) | greeting, calm sections, quiet empty states, "Getting started n/6" sidebar pill |
| Gumloop | [home](https://mobbin.com/screens/48547ec2-ac98-42fd-abcb-9c5e8be241ac) | agent product home: recent activity + what's next, sidebar meter |
| Langdock | [integrations flow](https://mobbin.com/flows/d7e174da-5154-4f88-ad29-c151a7a8284f) | card grid with Connect buttons, All / Connected / Needs setup chips, "Get started n% done" card |
| Attio | [connect flow](https://mobbin.com/flows/71af99f1-da65-40d7-9ded-20a2ebbcc6c0) | integration detail with connected rows |
| incident.io | [empty state](https://mobbin.com/screens/39cdcbd2-4334-4c16-b1ee-ba8c13064ac9) | small illustrative mock, title, one line, two buttons; used for every empty list and the 404 |

**Structure and pattern references (Linear, AirOps):**

The owner may swap these for a picked shortlist. Replace rows here and keep the "What Markpath takes" column honest.

| App | Screen | What Markpath takes |
|---|---|---|---|
| Linear | [issues, grouped backlog](https://mobbin.com/screens/fd1b4d88-f021-49a3-98af-4cd3a87e1d29) | sidebar on grey, inset white panel, group band with count, 36px rows |
| Linear | [active issues](https://mobbin.com/screens/d4e0a8da-a387-49c7-8940-b64521bd3809) | hover row tint, right-aligned date and assignee |
| Linear | [project issues by status](https://mobbin.com/screens/ef923b0e-9a40-4fdd-80f2-f3aafb4f36ce) | status circle icons on group bands |
| Linear | [issue detail](https://mobbin.com/screens/f00cc4fb-4083-43fc-a0fb-703a6c4ef771) | centred reading column, properties card, activity line |
| Linear | [saved view + filters](https://mobbin.com/screens/ed670cda-0527-4716-a1a6-0159f12c4f42) | header bar with title, description and right actions |
| Linear | [search / command](https://mobbin.com/screens/dba91946-d147-4b2f-ad92-4195eae017fc) | pill tabs as filter chips |
| Linear | [empty customers](https://mobbin.com/screens/f2e7538e-b21c-4933-a5d2-4e4c31853e88) | centred empty state with primary + secondary action |
| Linear | [settings general](https://mobbin.com/screens/fea37c46-ab06-4d46-86c7-333ffb0db455) | label + help left, control right, grouped in bordered blocks |
| Linear | [notification settings](https://mobbin.com/screens/fbb07294-5214-4769-97e0-f2bd9f8cb36a) | dense setting rows with hairlines |
| AirOps | [brand kit visual guidelines](https://mobbin.com/screens/fa709db6-3eba-45ef-9170-0836b887fd26) | rule table with "Applies to" tags, colour cards with hex |
| AirOps | [brand kit type scale](https://mobbin.com/screens/f9cfcc24-5acd-46fc-b8df-487b9b949d4b) | two-column spec table in a light-bordered card |
| AirOps | [brand kit empty region](https://mobbin.com/screens/fd111e8f-00be-4584-81b6-109b27299cbd) | large page title, tabs, friendly empty card |
| AirOps | [home](https://mobbin.com/screens/f7dbfcd9-92f0-47c4-abff-6d0373063e5a) | calm canvas, generous whitespace |
| AirOps | [prompts grid](https://mobbin.com/screens/dc762a82-155d-46c0-ac94-f48b0182a356) | table header row, quiet tags |
| AirOps | [campaign grid](https://mobbin.com/screens/e13f3ae9-9563-4947-b700-590413a2d73a) | toolbar of small secondary buttons |
| AirOps | [notification settings](https://mobbin.com/screens/fcb3eaa8-fc70-41b9-be36-43a9a0bcb176) | uppercase micro section labels, hairline rows |
| AirOps | [usage limits](https://mobbin.com/screens/fba4b577-c27e-4972-b354-9f8a7ece8f30) | page header with description and one primary action |
| AirOps | [databases empty](https://mobbin.com/screens/fb03a9d5-8eb2-4ab9-b25c-2feb187ee9aa) | soft well empty state |

## 9. Guardrails when editing

- Change presentation only. Keep server actions, form `name`s, hidden inputs, routes, aria attributes and `src/lib`/`src/server` untouched.
- No new npm dependencies. Motion is CSS only.
- Check every change with `npx tsc --noEmit`, at 320px and desktop, in light and dark (switcher and OS setting).
