import Link from "next/link";
import type { SetupData } from "@/server/dashboard/setup";
import { SetupCheckIcon, SetupStatusBadge, setupUi } from "@/components/setup-step";

/** Overview checklist: the same six steps as Integrations, each unfinished one linking to its step. */
export function SetupOverview({ setup }: { setup: SetupData }) {
  if (setup.requiredLeft === 0) return null;
  const required = setup.steps.filter((s) => !s.optional);
  return (
    <section aria-labelledby="setup-heading" className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold" id="setup-heading">Finish setting up <span className="text-sm font-normal text-muted">· {required.length - setup.requiredLeft} of {required.length} done</span></h2>
        <Link className={`text-sm underline ${setupUi.focus}`} href="/integrations">Open setup</Link>
      </div>
      <ol className="mt-3 grid gap-2">
        {setup.steps.map((s) => (
          <li className="flex items-start gap-3 text-sm" key={s.key}>
            {s.status === "done"
              ? <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700 text-white"><SetupCheckIcon className="h-3 w-3" /></span>
              : <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted">{s.n}</span>}
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                {s.status === "done"
                  ? <span className="font-medium text-muted">{s.title}</span>
                  : <Link className={`font-medium underline ${setupUi.focus}`} href={`/integrations#step-${s.n}`}>{s.title}</Link>}
                <SetupStatusBadge status={s.status} />
              </span>
              <span className="block text-muted">{s.status === "done" ? s.evidence : s.next ?? s.why}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
