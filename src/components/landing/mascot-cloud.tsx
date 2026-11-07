"use client";
import { Mascot, type MascotKind } from "@/components/mascot";

const roster: Array<{ kind: MascotKind; name: string; pos: string; size: string; tilt: string; bob: string }> = [
  { kind: "director", name: "Brand Director", pos: "md:left-[3%] md:-top-12", size: "h-16 w-16 md:h-[104px] md:w-[104px]", tilt: "-rotate-[7deg]", bob: "6.4s" },
  { kind: "design", name: "Design agent", pos: "md:right-[7%] md:-top-14", size: "h-[72px] w-[72px] md:h-[116px] md:w-[116px]", tilt: "rotate-[8deg]", bob: "7.6s" },
  { kind: "implementation", name: "Implementation agent", pos: "md:-left-3 md:-bottom-14", size: "h-14 w-14 md:h-[88px] md:w-[88px]", tilt: "-rotate-[4deg]", bob: "8.2s" },
  { kind: "qa", name: "Brand QA", pos: "md:right-[2%] md:-bottom-16", size: "h-16 w-16 md:h-[108px] md:w-[108px]", tilt: "rotate-[10deg]", bob: "6.9s" },
];

/** The four agents as large, uneven mascots around the Switch card. Decorative; the card lists the names. */
export function MascotCloud() {
  return <div className="relative z-10 mb-7 flex items-end justify-center gap-3 md:pointer-events-none md:absolute md:inset-0 md:mb-0 md:block">
    {roster.map((m, i) => <div className={`pointer-events-auto ${m.pos}`} key={m.kind}>
      <div className={`mp-mascot-item group ${m.tilt}`} style={{ "--mascot-bob": m.bob, "--mascot-delay": `${i * 0.8}s`, "--mascot-blink": `${1.1 + i * 0.9}s` } as React.CSSProperties}>
        <div className="mp-mascot-bob">
          <Mascot blink className={`${m.size} drop-shadow-[0_6px_10px_rgb(0_0_0/0.12)] transition-transform duration-short ease-out-cubic group-hover:scale-105 group-hover:rotate-0 motion-reduce:transition-none`} kind={m.kind} size={120} />
        </div>
      </div>
      <span className="sr-only">{m.name}</span>
    </div>)}
  </div>;
}
