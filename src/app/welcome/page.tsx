import Link from "next/link";
import { Logo } from "@/components/main-nav";
import { buttonClass } from "@/components/ui/primitives";
import { Mascot, type MascotKind } from "@/components/mascot";

export const metadata = { title: "Markpath · Brand operations, run by agents", description: "Markpath finds off-brand colours, fonts and corners in your code, Figma and Canva, asks you to approve the exact change, fixes it and checks the result. Agents work in a Switch chat room." };

const steps = [
  { n: "1", title: "Detect", body: "Agents read your GitHub repository, Figma files and Canva designs against your brand rules." },
  { n: "2", title: "Ask", body: "The Brand Director posts one approval in chat: what changes, where, from which value to which." },
  { n: "3", title: "Fix", body: "Reply approve. Figma and Canva are edited in place, and code arrives as a pull request you review." },
  { n: "4", title: "Verify", body: "A separate QA agent re-reads every file. Issues close only when it confirms." },
];

export default function WelcomePage() {
  return <div className="min-h-dvh bg-surface text-ink">
    <header className="sticky top-0 z-10 border-b border-transparent bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
      <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"><Logo />Markpath</span>
      <nav aria-label="Account" className="flex items-center gap-2"><Link className={buttonClass("ghost")} href="/login">Sign in</Link><Link className={buttonClass("primary")} href="/signup">Get started</Link></nav>
    </div></header>

    <main>
      <section className="relative mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24"><div className="relative">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1 text-xs text-muted"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2457F5]" />Four agents, one Switch room</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Keep your brand consistent everywhere.</h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">Markpath finds outdated colours, fonts and corners in your code, Figma and Canva. You approve the exact change in chat. Agents fix it and prove it worked.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2"><Link className={buttonClass("primary", "md", "px-4")} href="/signup">Get started free</Link><a className={buttonClass("secondary", "md", "px-4")} href="https://github.com/thatastral/markpath" rel="noreferrer" target="_blank">View on GitHub</a></div>
        <p className="mt-4 text-xs text-muted">Works with GitHub, Figma and Canva · Discord, Slack, Telegram and Teams</p>
      </div></section>

      <section aria-label="A conversation in the room" className="mx-auto mt-4 max-w-2xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-card border border-border bg-surface text-left text-sm shadow-pop"><div className="flex items-center gap-2 border-b border-border bg-canvas px-4 py-2.5 text-xs text-muted"><span aria-hidden className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /></span><span className="ml-1 font-medium text-ink"># brand-ops</span><span>· Switch room</span></div><div className="p-4 sm:p-5">
          {[
            ["You", "@mp-director fix the issues"],
            ["Brand Director", "Found 16 old values in Figma and 2 in Canva, and a colour in code. Approve? Reply approve or reject."],
            ["You", "@mp-director approve"],
            ["Brand QA", "Checked again: 0 old values left. Pull request #2 is open for review. Done."],
          ].map(([who, text], i) => <div className="flex gap-3 py-2" key={i}>
            <span aria-hidden className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ${who === "You" ? "bg-ink text-surface" : "bg-brand-soft text-brand"}`}>{who[0]}</span>
            <p className="min-w-0"><span className="font-medium">{who}</span><span className="ml-2 text-muted">{text}</span></p>
          </div>)}
        </div></div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-5xl px-4 pb-20 pt-24 sm:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.14em] text-muted">How it works</p>
        <h2 className="mx-auto mt-3 max-w-xl text-balance text-center text-3xl font-semibold tracking-tight" id="how">From “that’s off-brand” to fixed, in one conversation.</h2>
        <ol className="relative mt-12 grid gap-4 md:grid-cols-4">
          <span aria-hidden className="absolute left-0 right-0 top-5 hidden h-px bg-border md:block" />
          {steps.map((s) => <li className="relative" key={s.n}>
            <span className="relative z-[1] inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold tabular-nums shadow-card">{s.n}</span>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-muted">{s.body}</p>
          </li>)}
        </ol>
      </section>

      <section aria-labelledby="switch" className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid overflow-hidden rounded-card border border-border md:grid-cols-2">
          <div className="p-8 sm:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Built on Switch</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight" id="switch">A team of agents in the chat you already use.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Each agent has one job and acts only when mentioned. Switch carries the hand-offs between them and your approvals in chat. Without the room, there’s no team.</p>
            <ul className="mt-6 grid gap-2.5 text-sm">{["Real Figma and Canva edits through official connectors", "Real GitHub pull requests, never merged for you", "Paste any link and ask “is this on brand?”", "New pull requests checked automatically"].map((t) => <li className="flex gap-2.5" key={t}><span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />{t}</li>)}</ul>
          </div>
          <div className="grid content-center gap-2.5 border-t border-border bg-canvas p-8 sm:p-10 md:border-l md:border-t-0">
            {([["director", "Brand Director", "Plans the work and asks you to approve"], ["design", "Design agent", "Fixes Figma and Canva"], ["implementation", "Implementation agent", "Opens the GitHub pull request"], ["qa", "Brand QA", "Checks every fix on its own"]] as Array<[MascotKind, string, string]>).map(([kind, name, job], i) => <div className={`flex items-center gap-3 rounded-panel border border-border bg-surface px-4 py-3 ${i % 2 ? "md:ml-6" : ""}`} key={name}>
              <Mascot className="shrink-0" kind={kind} size={36} />
              <span className="min-w-0"><span className="block text-sm font-medium">{name}</span><span className="block text-xs text-muted">{job}</span></span>
            </div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-card bg-ink px-8 py-14 text-center text-surface sm:px-12">
          <div aria-hidden className="mb-6 flex justify-center gap-3"><Mascot kind="director" size={34} className="-rotate-6" /><Mascot kind="design" size={34} className="translate-y-2" /><Mascot kind="implementation" size={34} className="rotate-6" /><Mascot kind="qa" size={34} className="translate-y-1" /></div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Set up in minutes.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 opacity-70">Upload your guideline or paste your website. Connect GitHub, Figma and Canva. Bring the agents into your chat.</p>
          <Link className="mt-7 inline-flex min-h-10 items-center rounded-full bg-surface px-5 text-sm font-medium text-ink transition-opacity hover:opacity-90" href="/signup">Get started free</Link>
        </div>
      </section>
    </main>

    <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-6 text-xs text-muted sm:px-6"><span>Markpath · built for Flip the Switch, 2026</span><a className="hover:text-ink" href="https://github.com/thatastral/markpath" rel="noreferrer" target="_blank">GitHub</a></footer>
  </div>;
}
