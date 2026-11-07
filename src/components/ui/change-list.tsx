import type { ApprovalChange } from "@/lib/labels";
import { ChangeArrow, ValuePill } from "@/components/ui/primitives";

/** The exact values an approval will change, shown as from → to with swatches for colours. */
export function ChangeList({ changes }: { changes: ApprovalChange[] }) {
  return <ul className="grid gap-1.5 rounded-control border border-border bg-subtle/60 p-3 text-sm">{changes.map((c, i) => <li className="flex flex-wrap items-center gap-x-2 gap-y-1" key={`${c.property}-${i}`}>
    <span className="min-w-[5.5rem] font-medium capitalize">{c.property.replaceAll("_", " ")}</span>
    <ValuePill tone="old" value={c.from} /><ChangeArrow /><span className="sr-only">to</span><ValuePill tone="new" value={c.to} />
    <span className="ml-auto text-xs tabular-nums text-muted">{c.count === 1 ? "1 place" : `${c.count} places`}</span>
  </li>)}</ul>;
}
