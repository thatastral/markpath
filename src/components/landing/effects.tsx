"use client";
import { useEffect, useRef, useState } from "react";
import { Mascot, type MascotKind } from "@/components/mascot";
import { CheckIcon } from "@/components/ui/icons";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades and lifts [data-reveal] blocks in once, when they first scroll into view. */
export function LandingEffects() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("mp-motion");
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduced() || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);
  return null;
}

const agentKind: Record<string, MascotKind> = { "Brand Director": "director", "Brand QA": "qa" };

type Script = { ask: string; reply: string; title: string; qa: string };

const scripts: Script[] = [
  { ask: "Fix the off-brand values in Figma and Canva.", reply: "Found 18 old values across Figma and Canva. All point from #4F46E5 to #111111. Approve?", title: "18 changes", qa: "Checked again: 0 old values left. Pull request #2 is open for review. Done." },
  { ask: "The new deck still uses the old logo. Can you check?", reply: "Found 3 stretched logos in Figma and one in Canva. Replace them with the current mark?", title: "4 logos", qa: "Replaced all 4. The mark is the right shape and size in every file." },
  { ask: "Is the new pricing page on brand?", reply: "Checked the page: 2 old greys, a 6px button radius and the wrong heading weight. Approve the fix?", title: "4 changes", qa: "Re-checked the page: 0 issues left. Values and type now match the guidelines." },
  { ask: "@brand-director run a full review before we ship.", reply: "Read 42 files across GitHub, Figma and Canva. Found 5 places off-brand. Send them as one pull request?", title: "5 fixes", qa: "All 5 fixes verified. Nothing off-brand remains in the files we checked." },
];

const bubble = "rounded-[18px] px-3.5 py-2.5 text-sm leading-5";

function Avatar({ who }: { who: string }) {
  if (who === "You") return <span aria-hidden className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-2xs font-semibold text-surface">Y</span>;
  return <span aria-hidden className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface"><Mascot kind={agentKind[who]} size={20} /></span>;
}

function Typing({ who }: { who: string }) {
  return <div className="mp-msg flex items-center gap-2">
    <Avatar who={who} />
    <span aria-label={`${who} is typing`} className="mp-typing inline-flex items-center gap-1 rounded-[18px] border border-border bg-canvas px-3.5 py-3"><span className="h-1.5 w-1.5 rounded-full bg-muted" /><span className="h-1.5 w-1.5 rounded-full bg-muted" /><span className="h-1.5 w-1.5 rounded-full bg-muted" /></span>
  </div>;
}

function AgentLine({ who, children }: { who: string; children: React.ReactNode }) {
  return <div className="mp-msg flex gap-2">
    <Avatar who={who} />
    <div className="max-w-[86%]"><p className="mb-1 text-2xs font-medium text-muted">{who}</p>{children}</div>
  </div>;
}

/** The room card: a looping, changing conversation that plays while the card is on screen. */
export function ChatWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const script = scripts[cycle % scripts.length];

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !("IntersectionObserver" in window)) { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reduced()) { setStep(5); return; }
    setStep(0); setLeaving(false);
    const timers = [400, 1100, 1900, 3400, 4400].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    timers.push(window.setTimeout(() => setLeaving(true), 8700));
    timers.push(window.setTimeout(() => setCycle((c) => c + 1), 9200));
    return () => timers.forEach(clearTimeout);
  }, [inView, cycle]);

  return <div className="overflow-hidden rounded-card border border-border bg-surface text-left" ref={ref}>
    <div className="flex items-center gap-2 border-b border-border bg-canvas px-4 py-2.5 text-xs text-muted">
      <span aria-hidden className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /></span>
      <span className="ml-1 font-medium text-ink"># brand-ops</span><span>· Switch room</span>
      <span className="ml-auto inline-flex items-center gap-1.5"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />4 agents</span>
    </div>

    <div className={`flex min-h-[320px] flex-col gap-3.5 overflow-hidden p-4 transition-[opacity,transform] duration-normal ease-out-cubic motion-reduce:transition-none sm:h-[380px] sm:justify-end sm:p-5 ${leaving ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"}`}>
      {step >= 1 && <div className="mp-msg flex justify-end gap-2">
        <div className={`max-w-[82%] bg-ink text-surface ${bubble}`}>{script.ask}</div>
        <Avatar who="You" />
      </div>}

      {step === 2 && <Typing who="Brand Director" />}

      {step >= 3 && <AgentLine who="Brand Director">
        <div className={`border border-border bg-canvas ${bubble}`}>{script.reply}</div>
        <div className="mt-2 rounded-[14px] border border-border bg-surface p-2">
          <div className="flex items-center justify-between gap-2">
            <p className="pl-1 text-xs font-medium">{script.title}</p>
            {step >= 4 ? <span className="mp-msg inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-2xs font-medium text-surface"><CheckIcon size={11} />Approved</span>
              : <span aria-hidden className="flex items-center gap-1"><span className="rounded-full bg-ink px-2.5 py-1 text-2xs font-medium text-surface">Approve</span><span className="rounded-full border border-border-strong px-2.5 py-1 text-2xs font-medium">Reject</span></span>}
          </div>
        </div>
      </AgentLine>}

      {step >= 4 && step < 5 && <Typing who="Brand QA" />}

      {step >= 5 && <AgentLine who="Brand QA"><div className={`border border-border bg-canvas ${bubble}`}>{script.qa}</div></AgentLine>}
    </div>
  </div>;
}
