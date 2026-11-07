import Link from "next/link";
import { Logo } from "@/components/main-nav";
import { buttonClass } from "@/components/ui/primitives";
import { Mascot, type MascotKind } from "@/components/mascot";
import { ChatWindow, LandingEffects } from "@/components/landing/effects";
import { MascotCloud } from "@/components/landing/mascot-cloud";
import { StepVisual, ToolStrip } from "@/components/landing/visuals";

export const metadata = { title: "Markpath · Brand operations, run by agents", description: "Markpath finds off-brand colours, fonts and corners in your code, Figma and Canva, asks you to approve the exact change, fixes it and checks the result. Agents work in a Switch chat room." };

const GITHUB = "https://github.com/thatastral/markpath";
const DOCS = "https://github.com/thatastral/markpath/tree/main/docs";

const steps = [
  { n: "1", title: "Detect", body: "Agents read your GitHub repository, Figma files and Canva designs against your brand rules." },
  { n: "2", title: "Ask", body: "The Brand Director posts one approval in chat: what changes, where, from which value to which." },
  { n: "3", title: "Fix", body: "Reply approve. Figma and Canva are edited in place, and code arrives as a pull request you review." },
  { n: "4", title: "Verify", body: "A separate QA agent re-reads every file. Issues close only when it confirms." },
];

const agents: Array<[MascotKind, string, string]> = [
  ["director", "Brand Director", "Plans the work and asks you to approve"],
  ["design", "Design agent", "Fixes Figma and Canva"],
  ["implementation", "Implementation agent", "Opens the GitHub pull request"],
  ["qa", "Brand QA", "Checks every fix on its own"],
];

export default function WelcomePage() {
  return <div className="min-h-dvh overflow-x-clip bg-surface text-ink">
    <LandingEffects />
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight" href="/welcome"><Logo />Markpath</Link>
        <nav aria-label="Landing" className="hidden items-center gap-1 md:flex">
          <a className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-ink" href="#how">How it works</a>
          <a className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-ink" href="#switch">Built on Switch</a>
          <a className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-ink" href={DOCS} rel="noreferrer" target="_blank">Docs</a>
        </nav>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link className={buttonClass("ghost")} href="/login">Sign in</Link>
          <Link className={buttonClass("primary")} href="/signup">Get started</Link>
        </nav>
      </div>
    </header>

    <main>
      <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pb-14 sm:pt-24" data-reveal>
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1 text-xs text-muted"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink" />Four agents, one Switch room</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Keep your brand consistent everywhere.</h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">Markpath finds outdated colours, fonts and corners in your code, Figma and Canva. You approve the exact change in chat. Agents fix it and prove it worked.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link className={buttonClass("primary", "md", "px-4")} href="/signup">Get started free</Link>
          <a className={buttonClass("secondary", "md", "px-4")} href={GITHUB} rel="noreferrer" target="_blank">View on GitHub</a>
        </div>
        <p className="mt-4 text-xs text-muted">Works with GitHub, Figma and Canva · Chat in Telegram or Discord</p>
      </section>

      <section aria-label="Works with" className="mx-auto max-w-4xl border-y border-border/70 px-4 py-6 sm:px-6" data-reveal style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>
        <p className="text-center text-2xs font-medium uppercase tracking-[0.14em] text-muted">Works with the tools your brand already uses</p>
        <div className="mt-4"><ToolStrip /></div>
      </section>

      <section aria-label="A conversation in the room" className="mx-auto mt-12 max-w-2xl px-4 sm:mt-16 sm:px-6" data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
        <ChatWindow />
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-5xl px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
        <div data-reveal>
          <p className="text-center text-2xs font-medium uppercase tracking-[0.14em] text-muted">How it works</p>
          <h2 className="mx-auto mt-3 max-w-xl text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl" id="how">From “that’s off-brand” to fixed, in one conversation.</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted">No new tool to learn. The agents work in the chat room your team already has open.</p>
        </div>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => <li className="flex flex-col rounded-card border border-border bg-surface p-4" data-reveal key={s.n} style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
            <div className="flex min-h-[92px] items-center rounded-panel border border-border bg-canvas p-2.5"><div className="w-full"><StepVisual step={i} /></div></div>
            <div className="mt-4 flex items-center gap-2">
              <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border-strong text-2xs font-semibold tabular-nums text-muted">{s.n}</span>
              <h3 className="font-semibold">{s.title}</h3>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">{s.body}</p>
          </li>)}
        </ol>
      </section>

      <section aria-labelledby="switch-heading" className="mx-auto max-w-5xl px-4 pb-24 sm:px-6" id="switch">
        <div className="relative" data-reveal>
          <MascotCloud />
          <div className="grid overflow-hidden rounded-card border border-border bg-surface md:grid-cols-2">
            <div className="p-7 sm:p-10">
              <p className="text-2xs font-medium uppercase tracking-[0.14em] text-muted">Built on Switch</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl" id="switch-heading">A team of agents in the chat you already use.</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Each agent has one job and acts only when mentioned. Switch carries the hand-offs between them and your approvals in chat. Without the room, there’s no team.</p>
              <ul className="mt-6 grid gap-2.5 text-sm">{["Real Figma and Canva edits through official connectors", "Real GitHub pull requests, never merged for you", "Paste any link and ask “is this on brand?”", "New pull requests checked automatically"].map((t) => <li className="flex gap-2.5" key={t}><span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />{t}</li>)}</ul>
              <p className="mt-6"><a className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink lg:min-h-8" href={DOCS} rel="noreferrer" target="_blank">Read the setup docs</a></p>
            </div>
            <div className="border-t border-border bg-canvas p-7 sm:p-10 md:border-l md:border-t-0">
              <p className="text-2xs font-medium uppercase tracking-[0.14em] text-muted">The hand-off</p>
              <ol className="mt-4 grid gap-2">
                {agents.map(([kind, name, job], i) => <li className="relative flex items-center gap-3 rounded-panel border border-border bg-surface px-3.5 py-3" key={name}>
                  <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong text-2xs font-semibold tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{name}</span><span className="block text-xs text-muted">{job}</span></span>
                  <span aria-hidden className="text-faint">{i < agents.length - 1 ? "↓" : "✓"}</span>
                  <span className="sr-only">{kind === "qa" ? "Last step: verification" : "Hands off to the next agent"}</span>
                </li>)}
              </ol>
              <p className="mt-4 text-xs text-muted">You stay in the loop. Nothing changes until you approve it.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6" data-reveal>
        <div className="relative overflow-hidden rounded-card bg-ink px-7 py-14 text-center text-surface sm:px-12">
          <div aria-hidden className="mb-6 flex justify-center gap-3"><Mascot kind="director" size={34} className="-rotate-6" /><Mascot kind="design" size={34} className="translate-y-2" /><Mascot kind="implementation" size={34} className="rotate-6" /><Mascot kind="qa" size={34} className="translate-y-1" /></div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Set up in minutes.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 opacity-70">Upload your guideline or paste your website. Connect GitHub, Figma and Canva. Bring the agents into your chat.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link className="inline-flex min-h-10 items-center rounded-full bg-surface px-5 text-sm font-medium text-ink transition-opacity hover:opacity-90" href="/signup">Get started free</Link>
            <a className="inline-flex min-h-10 items-center rounded-full border border-surface/25 px-5 text-sm font-medium text-surface transition-colors hover:bg-surface/10" href={DOCS} rel="noreferrer" target="_blank">Read the docs</a>
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="inline-flex items-center gap-2"><Logo size="sm" />Markpath · built for Flip the Switch, 2026</span>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a className="inline-flex min-h-8 items-center hover:text-ink" href="#how">How it works</a>
          <a className="inline-flex min-h-8 items-center hover:text-ink" href="#switch">Built on Switch</a>
          <a className="inline-flex min-h-8 items-center hover:text-ink" href={DOCS} rel="noreferrer" target="_blank">Docs</a>
          <a className="inline-flex min-h-8 items-center hover:text-ink" href={GITHUB} rel="noreferrer" target="_blank">GitHub</a>
        </nav>
      </div>
    </footer>
  </div>;
}
