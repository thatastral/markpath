import { ProviderIcon, CheckIcon, GithubIcon } from "@/components/ui/icons";
import { SeverityIcon, ValuePill, ChangeArrow, StatusIcon } from "@/components/ui/primitives";

/** Tiny product mocks for the four "How it works" steps. Decorative, with text for context. */
export function StepVisual({ step }: { step: number }) {
  if (step === 0) return <div className="rounded-panel border border-border bg-surface px-3 py-2.5">
    <div className="flex items-center gap-2"><SeverityIcon severity="high" /><span className="min-w-0 flex-1 truncate text-xs font-medium">Primary button colour</span><span className="text-2xs tabular-nums text-muted">1 place</span></div>
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs"><ValuePill tone="old" value="#4F46E5" /><ChangeArrow /><ValuePill tone="new" value="#111111" /></div>
  </div>;
  if (step === 1) return <div className="rounded-panel border border-border bg-surface p-3">
    <div className="flex items-center gap-2"><span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-2xs font-semibold text-brand">BD</span><span className="text-xs font-medium">Brand Director</span><span className="ml-auto text-2xs text-muted">now</span></div>
    <p className="mt-1.5 text-xs text-muted">Change 18 values in Figma and Canva?</p>
    <div className="mt-2 flex gap-1.5"><span className="inline-flex min-h-6 items-center rounded-full bg-brand-solid px-2 text-2xs font-medium text-on-brand">Approve</span><span className="inline-flex min-h-6 items-center rounded-full border border-border-strong px-2 text-2xs font-medium">Reject</span></div>
  </div>;
  if (step === 2) return <div className="rounded-panel border border-border bg-surface p-3">
    <div className="flex items-center gap-2 text-xs"><GithubIcon className="shrink-0 text-muted" size={14} /><span className="min-w-0 flex-1 truncate font-medium">Fix 18 off-brand values</span><span className="rounded-full border border-success/40 px-1.5 text-2xs font-medium text-success">Open</span></div>
    <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-2xs text-muted"><span className="font-mono">PR #2</span><span>·</span><span>18 files</span><span className="ml-auto">review, never merged</span></div>
  </div>;
  return <div className="rounded-panel border border-border bg-surface p-3">
    <div className="flex items-center gap-2 text-xs"><StatusIcon kind="done" /><span className="font-medium">Brand QA</span><span className="ml-auto rounded-full border border-success/40 px-1.5 text-2xs font-medium text-success">Verified</span></div>
    <p className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 text-2xs text-muted"><CheckIcon className="text-success" size={12} /><span className="tabular-nums">0</span> old values left in 6 files</p>
  </div>;
}

const tools = [
  { id: "github", name: "GitHub" },
  { id: "figma", name: "Figma" },
  { id: "canva", name: "Canva" },
  { id: "switch", name: "Switch" },
  { id: "telegram", name: "Telegram" },
  { id: "discord", name: "Discord" },
];

/** Coloured tool logos, used as the landing page's quiet proof strip. */
export function ToolStrip() {
  return <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">{tools.map((t) => <li className="inline-flex items-center gap-2 text-sm font-medium text-muted" key={t.id}>
    <ProviderIcon provider={t.id} size={18} />
    <span>{t.name}</span>
  </li>)}</ul>;
}
