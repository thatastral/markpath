import Link from "next/link";
import type { SetupData } from "@/server/dashboard/setup";
import { SetupCheckIcon, SetupStatusBadge, setupUi } from "@/components/setup-step";
import { cardClass, linkClass, Progress } from "@/components/ui/primitives";
import { ChevronRight } from "@/components/ui/icons";

/** Overview checklist: the same six steps as Integrations, each unfinished one linking to its step. */
export function SetupOverview({ setup }: { setup: SetupData }) {
  if (setup.requiredLeft === 0) return null;
  const required = setup.steps.filter((s) => !s.optional);
  const done = required.length - setup.requiredLeft;
  return (
    <section aria-labelledby="setup-heading" className={`mt-8 ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight" id="setup-heading">Finish setting up</h2>
          <p className="text-sm text-muted"><span className="tabular-nums">{done} of {required.length}</span> needed steps done</p>
        </div>
        <Link className={`${linkClass} ${setupUi.focus}`} href="/integrations">Open setup<ChevronRight /></Link>
        <div className="w-full"><Progress label="Setup progress" max={required.length} value={done} /></div>
      </div>
      <ol className="divide-y divide-border border-t border-border">
        {setup.steps.map((s) => (
          <li className="flex items-start gap-3 px-4 py-3 text-sm sm:px-5" key={s.key}>
            {s.status === "done"
              ? <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-surface"><SetupCheckIcon className="h-3 w-3" /></span>
              : <span aria-hidden className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-semibold tabular-nums ${s.status === "needs_you" ? "border-brand text-brand" : "border-border-strong text-muted"}`}>{s.n}</span>}
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                {s.status === "done"
                  ? <span className="font-medium text-muted">{s.title}</span>
                  : <Link className={`font-medium underline decoration-border-strong underline-offset-4 hover:decoration-brand ${setupUi.focus}`} href={`/integrations#step-${s.n}`}>{s.title}</Link>}
                <SetupStatusBadge status={s.status} />
              </span>
              <span className="mt-0.5 block text-muted">{s.status === "done" ? s.evidence : s.next ?? s.why}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
