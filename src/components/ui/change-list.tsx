import type { ApprovalChange } from "@/lib/labels";
import { ChangeArrow, ValuePill } from "@/components/ui/primitives";

/** The exact values an approval will change, shown as from → to with swatches for colours. */
export function ChangeList({ changes }: { changes: ApprovalChange[] }) {
  return <ul className="divide-y divide-border overflow-hidden rounded-control border border-border text-sm">{changes.map((c, i) => <li className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5" key={`${c.property}-${i}`}>
    <span className="min-w-[5.5rem] capitalize text-muted">{c.property.replaceAll("_", " ")}</span>
    <ValuePill tone="old" value={c.from} /><ChangeArrow /><span className="sr-only">to</span><ValuePill tone="new" value={c.to} />
    <span className="ml-auto text-xs tabular-nums text-muted">{c.count === 1 ? "1 place" : `${c.count} places`}</span>
  </li>)}</ul>;
}
