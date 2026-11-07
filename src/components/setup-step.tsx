import type { ReactNode } from "react";
import { setupStatusLabel, type SetupStatus, type SetupStep } from "@/server/dashboard/setup";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const setupUi = {
  focus,
  primary: `inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white ${focus}`,
  secondary: `inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm font-medium ${focus}`,
  input: `w-full min-w-0 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 ${focus}`,
};

const badge: Record<SetupStatus, string> = {
  done: "border-green-700 text-green-800",
  needs_you: "border-brand text-brand",
  optional: "border-border text-muted",
  not_started: "border-border text-muted",
};

export function SetupStatusBadge({ status }: { status: SetupStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge[status]}`}>{setupStatusLabel[status]}</span>;
}

export function SetupCheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg aria-hidden className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

function Marker({ step }: { step: SetupStep }) {
  return step.status === "done"
    ? <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-white"><SetupCheckIcon /></span>
    : <span aria-hidden className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${step.status === "needs_you" ? "border-brand text-brand" : "border-border text-muted"}`}>{step.n}</span>;
}

/** One numbered setup step. Done steps collapse to a single "Working" line with a Change disclosure. */
export function SetupStepCard({ step, children, note }: { step: SetupStep; children?: ReactNode; note?: ReactNode }) {
  const title = <><span className="sr-only">Step {step.n}: </span>{step.title}</>;
  const body = <>
    <p className="text-sm text-muted">{step.why}</p>
    <p className="mt-2 text-sm"><span className="font-medium">What you&apos;ll need:</span> <span className="text-muted">{step.needs}</span> <span className="whitespace-nowrap text-muted">· {step.time}</span></p>
    {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    {step.next && <p className="mt-2 text-sm font-medium">{step.next}</p>}
    {children && <div className="mt-4">{children}</div>}
  </>;

  if (step.status === "done") return (
    <li className="scroll-mt-6 rounded-lg border border-border bg-surface" id={`step-${step.n}`}>
      <details className="group">
        <summary className={`flex cursor-pointer list-none items-start gap-3 rounded-lg p-4 [&::-webkit-details-marker]:hidden ${focus}`}>
          <Marker step={step} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="font-semibold">{title}</h3>{step.optional && <span className="text-xs text-muted">Optional</span>}</span>
            <span className="text-sm text-green-800">Working: {step.evidence}</span>
          </span>
          <span className="shrink-0 pt-1 text-sm font-medium text-brand underline"><span className="group-open:hidden">Change</span><span className="hidden group-open:inline">Close</span></span>
        </summary>
        <div className="border-t border-border p-4">{body}</div>
      </details>
    </li>
  );

  return (
    <li className={`scroll-mt-6 rounded-lg border bg-surface p-4 sm:p-5 ${step.status === "needs_you" ? "border-brand" : "border-border"}`} id={`step-${step.n}`}>
      <div className="flex items-start gap-3">
        <Marker step={step} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-lg font-semibold">{title}</h3><SetupStatusBadge status={step.status} /></div>
          <div className="mt-1">{body}</div>
        </div>
      </div>
    </li>
  );
}
