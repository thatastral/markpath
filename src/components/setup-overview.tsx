import Link from "next/link";
import type { SetupData } from "@/server/dashboard/setup";
import { SetupMarker, SetupStatusBadge, setupUi } from "@/components/setup-step";
import { cardClass, linkClass, Progress } from "@/components/ui/primitives";
import { ChevronRight } from "@/components/ui/icons";

/** Overview checklist: the same steps as Integrations, each unfinished one linking to its step. */
export function SetupOverview({ setup }: { setup: SetupData }) {
  if (setup.requiredLeft === 0) return null;
  const required = setup.steps.filter((s) => !s.optional);
  const done = required.length - setup.requiredLeft;
  return (
    <section aria-labelledby="setup-heading" className={`mt-8 overflow-hidden ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight" id="setup-heading">Finish setting up</h2>
          <p className="text-sm text-muted"><span className="tabular-nums">{done} of {required.length}</span> steps done</p>
        </div>
        <Link className={`${linkClass} text-sm ${setupUi.focus}`} href="/integrations">Continue setup<ChevronRight size={14} /></Link>
        <div className="w-full"><Progress label="Setup progress" max={required.length} value={done} /></div>
      </div>
      <ol className="border-t border-border">
        {setup.steps.map((s) => (
          <li className="flex min-h-11 items-start gap-3 border-b border-border px-4 py-2.5 text-sm last:border-b-0 sm:px-5" key={s.key}>
            <SetupMarker step={s} small />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {s.status === "done"
                  ? <span className="text-muted">{s.title}</span>
                  : <Link className={`font-medium hover:text-brand ${setupUi.focus}`} href={`/integrations#step-${s.n}`}>{s.title}</Link>}
                {s.status !== "done" && <SetupStatusBadge status={s.status} />}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{s.status === "done" ? s.evidence : s.next ?? s.why}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
