import Link from "next/link";
import { Logo } from "@/components/main-nav";
import { buttonClass } from "@/components/ui/primitives";

export const metadata = { title: "Markpath · Brand operations, run by agents", description: "Markpath finds off-brand colours, fonts and corners in your code, Figma and Canva, asks you to approve the exact change, fixes it and checks the result. Agents work in a Switch chat room." };

const steps = [
  { n: "1", title: "Detect", body: "Agents read your GitHub repository, Figma files and Canva designs against your brand rules." },
  { n: "2", title: "Ask", body: "The Brand Director posts one approval in chat: what changes, where, from which value to which." },
  { n: "3", title: "Fix", body: "Reply approve. Figma and Canva are edited in place, and code arrives as a pull request you review." },
  { n: "4", title: "Verify", body: "A separate QA agent re-reads every file. Issues close only when it confirms." },
];

export default function WelcomePage() {
  return <div className="min-h-dvh bg-surface text-ink">
    <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"><Logo />Markpath</span>
      <nav aria-label="Account" className="flex items-center gap-2"><Link className={buttonClass("ghost")} href="/login">Sign in</Link><Link className={buttonClass("primary")} href="/signup">Get started</Link></nav>
    </header>

    <main>
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1 text-xs text-muted"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2457F5]" />Four agents, one Switch room</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Keep your brand consistent everywhere.</h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">Markpath finds outdated colours, fonts and corners in your code, Figma and Canva. You approve the exact change in chat. Agents fix it and prove it worked.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2"><Link className={buttonClass("primary", "md", "px-4")} href="/signup">Get started free</Link><a className={buttonClass("secondary", "md", "px-4")} href="https://github.com/thatastral/markpath" rel="noreferrer" target="_blank">View on GitHub</a></div>
      </section>

      <section aria-label="What Markpath changes" className="mx-auto mt-10 max-w-2xl px-4 sm:px-6">
        <svg className="h-auto w-full" role="img" viewBox="0 0 640 150" aria-labelledby="ill-title"><title id="ill-title">Old brand values become the new ones: colour, typeface and corner radius</title>
          <g fontFamily="var(--font-sans)" fontSize="12">
            {[0, 1, 2].map((i) => <g key={i} transform={`translate(${i * 215} 0)`}>
              <rect x="1" y="1" width="208" height="148" rx="18" fill="var(--color-canvas)" stroke="var(--color-border)" />
              <text x="20" y="30" fill="var(--color-muted)">{["Colour", "Typeface", "Corner radius"][i]}</text>
              {i === 0 && <><rect x="20" y="52" width="40" height="40" rx="10" fill="#164B9B" opacity="0.45" /><path d="M76 72h28m-8-7l8 7-8 7" stroke="var(--color-muted)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><rect x="120" y="52" width="40" height="40" rx="10" fill="#2457F5" /><text x="20" y="122" fill="var(--color-muted)" fontFamily="var(--font-mono)">#164B9B → #2457F5</text></>}
              {i === 1 && <><text x="20" y="84" fontSize="26" fill="var(--color-faint)" fontFamily="Georgia, serif">Aa</text><path d="M76 76h28m-8-7l8 7-8 7" stroke="var(--color-muted)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><text x="120" y="84" fontSize="26" fontWeight="600" fill="var(--color-ink)">Aa</text><text x="20" y="122" fill="var(--color-muted)" fontFamily="var(--font-mono)">Inter → Geist</text></>}
              {i === 2 && <><rect x="20" y="58" width="46" height="28" rx="3" fill="none" stroke="var(--color-faint)" strokeWidth="1.6" /><path d="M76 72h28m-8-7l8 7-8 7" stroke="var(--color-muted)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><rect x="120" y="58" width="46" height="28" rx="9" fill="none" stroke="var(--color-ink)" strokeWidth="1.6" /><text x="20" y="122" fill="var(--color-muted)" fontFamily="var(--font-mono)">4px → 8px</text></>}
              <circle cx="186" cy="26" r="7" fill="var(--color-success-soft)" /><path d="M182.5 26l2.4 2.4 4.6-4.8" stroke="var(--color-success)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>)}
          </g>
        </svg>
      </section>

      <section aria-label="A conversation in the room" className="mx-auto mt-4 max-w-2xl px-4 sm:px-6">
        <div className="rounded-card border border-border bg-canvas p-4 text-left text-sm shadow-card sm:p-5">
          {[
            ["You", "@mp-director fix the issues"],
            ["Brand Director", "Found 16 old values in Figma and 2 in Canva, and a colour in code. Approve? Reply approve or reject."],
            ["You", "@mp-director approve"],
            ["Brand QA", "Checked again: 0 old values left. Pull request #2 is open for review. Done."],
          ].map(([who, text], i) => <div className="flex gap-3 py-2" key={i}>
            <span aria-hidden className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ${who === "You" ? "bg-ink text-surface" : "bg-brand-soft text-brand"}`}>{who[0]}</span>
            <p className="min-w-0"><span className="font-medium">{who}</span><span className="ml-2 text-muted">{text}</span></p>
          </div>)}
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight" id="how">How it works</h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => <li className="rounded-card border border-border p-5" key={s.n}><span className="text-xs font-medium tabular-nums text-brand">{s.n}</span><h3 className="mt-2 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-muted">{s.body}</p></li>)}
        </ol>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">Nothing changes without your approval. Each approval covers one exact change and works once. Pull requests are never merged for you, and judgement calls like contrast, tone of voice and logo use are flagged for a person.</p>
      </section>

      <section aria-labelledby="switch" className="border-y border-border bg-canvas">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6">
          <div><h2 className="text-2xl font-semibold tracking-tight" id="switch">Built on Switch</h2><p className="mt-3 text-sm text-muted">The agents live in a Switch room and act only when mentioned. Switch carries the hand-offs between Director, Design, Implementation and QA, and your approvals in chat. Use it in Discord, Slack, Telegram or Teams.</p></div>
          <ul className="grid gap-2 text-sm">{["Real Figma and Canva edits through their official connectors", "Real GitHub pull requests, never merged, main branch untouched", "Paste any link and ask “is this on brand?”", "New pull requests checked automatically"].map((t) => <li className="flex gap-2" key={t}><span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>)}</ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Set up in minutes</h2>
        <p className="mt-2 text-sm text-muted">Upload your guideline or paste your website, connect GitHub, Figma and Canva, then bring the agents into your chat.</p>
        <Link className={buttonClass("primary", "md", "mt-6 px-4")} href="/signup">Get started free</Link>
      </section>
    </main>

    <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-6 text-xs text-muted sm:px-6"><span>Markpath · built for Flip the Switch, 2026</span><a className="hover:text-ink" href="https://github.com/thatastral/markpath" rel="noreferrer" target="_blank">GitHub</a></footer>
  </div>;
}
