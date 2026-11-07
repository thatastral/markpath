"use client";
import { Mascot, type MascotKind } from "@/components/mascot";

type Item = { kind: MascotKind; name: string; pos: string; size: string; tilt: string; bob: string; roam?: [string, string, string] };

const panelRoster: Item[] = [
  { kind: "director", name: "Brand Director", pos: "md:left-[3%] md:-top-12", size: "h-16 w-16 md:h-[104px] md:w-[104px]", tilt: "-rotate-[7deg]", bob: "6.4s" },
  { kind: "design", name: "Design agent", pos: "md:right-[7%] md:-top-14", size: "h-[72px] w-[72px] md:h-[116px] md:w-[116px]", tilt: "rotate-[8deg]", bob: "7.6s" },
  { kind: "implementation", name: "Implementation agent", pos: "md:-left-3 md:-bottom-14", size: "h-14 w-14 md:h-[88px] md:w-[88px]", tilt: "-rotate-[4deg]", bob: "8.2s" },
  { kind: "qa", name: "Brand QA", pos: "md:right-[2%] md:-bottom-16", size: "h-16 w-16 md:h-[108px] md:w-[108px]", tilt: "rotate-[10deg]", bob: "6.9s" },
];

const ctaRoster: Item[] = [
  { kind: "director", name: "Brand Director", pos: "md:left-4 md:top-5", size: "h-14 w-14 md:h-[104px] md:w-[104px] xl:h-[124px] xl:w-[124px]", tilt: "-rotate-[7deg]", bob: "6.4s", roam: ["24px", "14px", "30s"] },
  { kind: "design", name: "Design agent", pos: "md:right-6 md:top-2", size: "h-14 w-14 md:h-[112px] md:w-[112px] xl:h-[132px] xl:w-[132px]", tilt: "rotate-[8deg]", bob: "7.6s", roam: ["18px", "16px", "34s"] },
  { kind: "implementation", name: "Implementation agent", pos: "md:left-14 md:bottom-2", size: "h-[52px] w-[52px] md:h-[88px] md:w-[88px] xl:h-[104px] xl:w-[104px]", tilt: "-rotate-[4deg]", bob: "8.2s", roam: ["28px", "12px", "27s"] },
  { kind: "qa", name: "Brand QA", pos: "md:right-4 md:bottom-4", size: "h-14 w-14 md:h-[96px] md:w-[96px] xl:h-[116px] xl:w-[116px]", tilt: "rotate-[10deg]", bob: "6.9s", roam: ["16px", "18px", "32s"] },
];

/** The four agents as large, uneven mascots. "panel" floats them around a card; "cta" keeps them inside a dark panel and lets them roam slowly. */
export function MascotCloud({ variant = "panel" }: { variant?: "panel" | "cta" }) {
  const roster = variant === "cta" ? ctaRoster : panelRoster;
  return <div className={`flex items-end justify-center gap-4 md:pointer-events-none md:absolute md:inset-0 md:block ${variant === "cta" ? "relative z-0 mb-7 md:mb-0" : "relative z-10 mb-7 md:mb-0"}`}>
    {roster.map((m, i) => <div className={`pointer-events-auto md:absolute ${m.pos} ${m.roam ? "mp-mascot-roam" : ""}`} key={m.kind} style={m.roam ? { "--roam-x": m.roam[0], "--roam-y": m.roam[1], "--roam-dur": m.roam[2] } as React.CSSProperties : undefined}>
      <div className={`mp-mascot-item group ${m.tilt}`} style={{ "--mascot-bob": m.bob, "--mascot-delay": `${i * 0.8}s`, "--mascot-blink": `${1.1 + i * 0.9}s` } as React.CSSProperties}>
        <div className="mp-mascot-bob">
          <Mascot blink className={`${m.size} drop-shadow-[0_10px_18px_rgb(0_0_0/0.22)] transition-transform duration-short ease-out-cubic group-hover:scale-105 motion-reduce:transition-none`} kind={m.kind} size={120} />
        </div>
      </div>
      <span className="sr-only">{m.name}</span>
    </div>)}
  </div>;
}
