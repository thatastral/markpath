"use client";
import { useEffect, useRef, useState } from "react";

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

const messages: Array<[string, string]> = [
  ["You", "@mp-director fix the issues"],
  ["Brand Director", "Found 16 old values in Figma and 2 in Canva, and a colour in code. Approve? Reply approve or reject."],
  ["You", "@mp-director approve"],
  ["Brand QA", "Checked again: 0 old values left. Pull request #2 is open for review. Done."],
];

/** The room card: its messages appear one at a time the first time the card is seen. */
export function ChatWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced() || !("IntersectionObserver" in window)) {
      setShown(messages.length);
      return;
    }
    let timers: number[] = [];
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      timers = messages.map((_, i) => window.setTimeout(() => setShown(i + 1), 420 + i * 520));
    }, { threshold: 0.25 });
    observer.observe(el);
    return () => { observer.disconnect(); timers.forEach(clearTimeout); };
  }, []);
  return <div className="overflow-hidden rounded-card border border-border bg-surface text-left text-sm" ref={ref}>
    <div className="flex items-center gap-2 border-b border-border bg-canvas px-4 py-2.5 text-xs text-muted">
      <span aria-hidden className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /><span className="h-2.5 w-2.5 rounded-full bg-border-strong" /></span>
      <span className="ml-1 font-medium text-ink"># brand-ops</span><span>· Switch room</span>
    </div>
    <div className="min-h-[232px] p-4 sm:min-h-[216px] sm:p-5">
      {messages.map(([who, text], i) => <div className={`flex gap-3 py-2 transition-[opacity,transform] duration-normal ease-out-cubic motion-reduce:transition-none ${i < shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`} key={i}>
        <span aria-hidden className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold ${who === "You" ? "bg-ink text-surface" : "bg-brand-soft text-brand"}`}>{who[0]}</span>
        <p className="min-w-0"><span className="font-medium">{who}</span><span className="ml-2 text-muted">{text}</span></p>
      </div>)}
    </div>
  </div>;
}
