# Brief for Opencode: polish the landing page and the dashboard

Project: this repository (Next.js 16, TypeScript, Tailwind). Live: https://markpath.vercel.app. Read first: `AGENTS.md` (this Next.js version differs from older docs: check `node_modules/next/dist/docs`), `.claude/skills/markpath-design/SKILL.md` (the design rules: follow them), `README.md`.

## Workflow (must follow: nothing reaches the live site without the owner's approval)
1. `git checkout -b polish/opencode` from `main`. Never commit to `main`, never run `vercel deploy --prod`.
2. Work in small commits. After each batch run: `npm run typecheck && npm test && npm run build`. All must pass.
3. Publish a preview: `vercel deploy` (no `--prod`). It prints a preview URL. Previews use a temporary database, so sign up there with a throwaway email; data can disappear.
4. Send the owner the preview URL and a short list of what changed with before/after screenshots. **Stop and wait.**
5. Only after the owner says "approved": `git checkout main && git merge --no-ff polish/opencode && git push && vercel deploy --prod`.

## Scope: presentation only
Change layout, spacing, type, colour, icons, illustrations, motion and copy. Do **not** change server code (`src/server/**`), API routes (`src/app/api/**`), server actions' names or form field names, database code, tests' meaning, or `package.json` (ask the owner before adding a package). Keep every route and every aria attribute working.

Design direction: clean black and white (Attio-calm light theme, Linear-like dark theme), pill buttons, rounded cards, Geist, Heroicons, coloured tool logos that grey out until connected, the four agent mascots (`src/components/mascot.tsx`) as the only playful colour. Use Mobbin for references: Linear, Attio, Vercel, Stripe landing and dashboard screens.

## Landing page (`src/app/welcome/page.tsx`)
1. Hero: keep the headline and chat-window card (the owner likes them). Add a subtle product visual or the mascots in a tasteful way; no gradients or glows.
2. "How it works": make the four steps feel richer (small visual per step, for example an issue row, an approval message, a pull request chip, a QA check), still clean.
3. "Built on Switch": refine spacing and the agent cards; mascots may animate gently on hover (respect `prefers-reduced-motion`).
4. "Set up in minutes" block and footer: polish; add links to GitHub and the docs.
5. Mobile (375px): no sideways scroll, comfortable spacing.

## Dashboard (everything under `src/app/(app)/**`, `src/app/onboarding/**`, `src/components/**`)
1. Overview: the stat tiles and "Needs your decision" should feel like the most important part of the page; tidy recent activity and tools.
2. Integrations: the tool grid and setup steps are still dense. Make each tool card show one clear state (Connected / Needs you / Coming soon) and one action. Keep the setup logic.
3. Chat apps: Telegram and Discord are the supported ones; Slack and Teams show "Coming soon" (if the owner confirms Discord works, label it "Available").
4. Issues: rows easier to scan; the "Open in Figma / Canva / GitHub" link visible but quiet; approval cards prominent.
5. Brand rules, Reviews, Activity, onboarding modal, sign-in/sign-up: consistent spacing, headers and empty states. Reviews: show findings expanded by default (currently hidden behind a toggle).
6. Onboarding top bar wraps to two lines at 375px: fix.
7. Check both themes (System / Light / Dark switch in the sidebar) at desktop and 375px.

## Known gaps not to "fix" by faking
- Password reset email is off until a sending domain exists: keep the honest message.
- Figma/Canva issue links open the file, not the exact layer (the data has no node ids).
- One-click chat install isn't built: don't add buttons that pretend it is.

## Done when
The owner approves the preview, it's merged to `main`, deployed with `vercel deploy --prod`, and the live site matches the preview.
