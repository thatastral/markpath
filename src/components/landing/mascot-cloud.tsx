"use client";
import { Mascot, type MascotKind } from "@/components/mascot";

type Item = { kind: MascotKind; name: string; pos: string; size: string; tilt: string; bob: string };

const panelRoster: Item[] = [
  { kind: "director", name: "Brand Director", pos: "md:left-[3%] md:-top-12", size: "h-16 w-16 md:h-[104px] md:w-[104px]", tilt: "-rotate-[7deg]", bob: "6.4s" },
  { kind: "design", name: "Design agent", pos: "md:right-[7%] md:-top-14", size: "h-[72px] w-[72px] md:h-[116px] md:w-[116px]", tilt: "rotate-[8deg]", bob: "7.6s" },
  { kind: "implementation", name: "Implementation agent", pos: "md:-left-3 md:-bottom-14", size: "h-14 w-14 md:h-[88px] md:w-[88px]", tilt: "-rotate-[4deg]", bob: "8.2s" },
  { kind: "qa", name: "Brand QA", pos: "md:right-[2%] md:-bottom-16", size: "h-16 w-16 md:h-[108px] md:w-[108px]", tilt: "rotate-[10deg]", bob: "6.9s" },
];

const ctaRoster: Item[] = [
  { kind: "director", name: "Brand Director", pos: "md:left-5 md:top-5", size: "h-12 w-12 md:h-[76px] md:w-[76px]", tilt: "-rotate-[7deg]", bob: "6.4s" },
  { kind: "design", name: "Design agent", pos: "md:right-7 md:top-4", size: "h-12 w-12 md:h-[84px] md:w-[84px]", tilt: "rotate-[8deg]", bob: "7.6s" },
  { kind: "implementation", name: "Implementation agent", pos: "md:left-10 md:bottom-4", size: "h-11 w-11 md:h-[64px] md:w-[64px]", tilt: "-rotate-[4deg]", bob: "8.2s" },
  { kind: "qa", name: "Brand QA", pos: "md:right-5 md:bottom-5", size: "h-12 w-12 md:h-[72px] md:w-[72px]", tilt: "rotate-[10deg]", bob: "6.9s" },
];

/** The four agents as large, uneven mascots. "panel" floats them around a card; "cta" keeps them inside a dark panel. */
export function MascotCloud({ variant = "panel" }: { variant?: "panel" | "cta" }) {
  const roster = variant === "cta" ? ctaRoster : panelRoster;
  return <div className={`flex items-end justify-center gap-4 md:pointer-events-none md:absolute md:inset-0 md:block ${variant === "cta" ? "relative z-0 mb-6 md:mb-0" : "relative z-10 mb-7 md:mb-0"}`}>
    {roster.map((m, i) => <div className={`pointer-events-auto ${m.pos}`} key={m.kind}>
      <div className={`mp-mascot-item group ${m.tilt}`} style={{ "--mascot-bob": m.bob, "--mascot-delay": `${i * 0.8}s`, "--mascot-blink": `${1.1 + i * 0.9}s` } as React.CSSProperties}>
        <div className="mp-mascot-bob">
          <Mascot blink className={`${m.size} drop-shadow-[0_6px_10px_rgb(0_0_0/0.12)] transition-transform duration-short ease-out-cubic group-hover:scale-105 motion-reduce:transition-none`} kind={m.kind} size={120} />
        </div>
      </div>
      <span className="sr-only">{m.name}</span>
    </div>)}
  </div>;
}
