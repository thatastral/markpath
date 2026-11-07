/** Markpath's agent mascots: soft geometric characters, one colour and shape per agent. Decorative only. */
const agents = {
  director: { fill: "#2457F5", shape: "M12 2c5.5 0 10 4.1 10 9.6S17.5 22 12 22 2 17.1 2 11.6 6.5 2 12 2z" },
  design: { fill: "#FF7262", shape: "M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4z" },
  implementation: { fill: "#0ACF83", shape: "M12 2.5l8.5 5v9L12 21.5l-8.5-5v-9z" },
  qa: { fill: "#FFB020", shape: "M12 3c2.2 0 3 1.6 4.6 2.4 1.6.8 3.4.6 4.2 2.6.8 2-.6 3.2-.6 4.9s1.4 2.9.6 4.9c-.8 2-2.6 1.8-4.2 2.6C15 21.2 14.2 22 12 22s-3-.8-4.6-1.6c-1.6-.8-3.4-.6-4.2-2.6-.8-2 .6-3.2.6-4.9s-1.4-2.9-.6-4.9c.8-2 2.6-1.8 4.2-2.6C9 4.6 9.8 3 12 3z" },
} as const;
export type MascotKind = keyof typeof agents;

export function Mascot({ kind, size = 40, className = "", blink = false }: { kind: MascotKind; size?: number; className?: string; blink?: boolean }) {
  const a = agents[kind];
  return <svg aria-hidden className={className} height={size} viewBox="0 0 24 24" width={size}>
    <path d={a.shape} fill={a.fill} />
    <g className={blink ? "mp-mascot-eyes" : undefined}>
      <ellipse cx="9.2" cy="11.2" fill="#fff" rx="1.9" ry="2.3" /><ellipse cx="14.8" cy="11.2" fill="#fff" rx="1.9" ry="2.3" />
      <circle cx="9.7" cy="11.6" fill="#111" r="1" /><circle cx="15.3" cy="11.6" fill="#111" r="1" />
    </g>
    <path d="M10.4 15.4c.9.7 2.3.7 3.2 0" fill="none" stroke="#111" strokeLinecap="round" strokeWidth="0.9" />
  </svg>;
}
