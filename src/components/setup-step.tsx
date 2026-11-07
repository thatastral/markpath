import type { ReactNode } from "react";
import { setupStatusLabel, type SetupStatus, type SetupStep } from "@/server/dashboard/setup";
import { Badge, buttonClass, cardClass, type Tone } from "@/components/ui/primitives";
import { ChevronRight, ClockIcon } from "@/components/ui/icons";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const setupUi = {
  focus,
  primary: buttonClass("primary"),
  secondary: buttonClass("secondary"),
  input: "w-full min-w-0 rounded-control border border-border-strong bg-surface px-3 py-2 text-sm shadow-card placeholder:text-muted hover:border-muted",
};

const tone: Record<SetupStatus, Tone> = { done: "success", needs_you: "brand", optional: "neutral", not_started: "neutral" };

export function SetupStatusBadge({ status }: { status: SetupStatus }) {
  return <Badge tone={tone[status]}>{setupStatusLabel[status]}</Badge>;
}

export function SetupCheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg aria-hidden className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

function Marker({ step }: { step: SetupStep }) {
  return step.status === "done"
    ? <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-surface"><SetupCheckIcon /></span>
    : <span aria-hidden className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums ${step.status === "needs_you" ? "border-brand bg-brand-soft text-brand" : "border-border-strong bg-surface text-muted"}`}>{step.n}</span>;
}

/** One numbered setup step. Done steps collapse to a single "Working" line with a Change disclosure. */
export function SetupStepCard({ step, children, note }: { step: SetupStep; children?: ReactNode; note?: ReactNode }) {
  const title = <><span className="sr-only">Step {step.n}: </span>{step.title}</>;
  const body = <>
    <p className="text-sm leading-relaxed text-muted">{step.why}</p>
    <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2 text-sm">
      <p className="min-w-0 flex-1 basis-64"><span className="font-medium">What you&apos;ll need:</span> <span className="text-muted">{step.needs}</span></p>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted"><ClockIcon size={12} />{step.time}</span>
    </div>
    {note && <p className="mt-3 rounded-control bg-subtle px-3 py-2 text-sm text-muted">{note}</p>}
    {step.next && <p className="mt-3 flex items-start gap-2 text-sm font-medium"><ChevronRight className="mt-0.5 shrink-0 text-brand" />{step.next}</p>}
    {children && <div className="mt-4 border-t border-border pt-4">{children}</div>}
  </>;

  if (step.status === "done") return (
    <li className={`scroll-mt-24 ${cardClass}`} id={`step-${step.n}`}>
      <details className="group">
        <summary className={`flex cursor-pointer items-center gap-3 rounded-card p-4 hover:bg-subtle/60 ${focus}`}>
          <Marker step={step} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="font-semibold">{title}</h3>{step.optional && <span className="text-xs text-muted">Optional</span>}</span>
            <span className="text-sm text-success">Working: {step.evidence}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand"><span className="group-open:hidden">Change</span><span className="hidden group-open:inline">Close</span><ChevronRight className="chev" /></span>
        </summary>
        <div className="border-t border-border p-4 sm:pl-[3.75rem]">{body}</div>
      </details>
    </li>
  );

  return (
    <li className={`scroll-mt-24 rounded-card border bg-surface p-4 shadow-card sm:p-5 ${step.status === "needs_you" ? "border-brand/50 ring-4 ring-brand/10" : "border-border"}`} id={`step-${step.n}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <Marker step={step} />
        <div className="min-w-0 flex-1">
          <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-lg font-semibold tracking-tight">{title}</h3><SetupStatusBadge status={step.status} /></div>
          <div className="mt-1">{body}</div>
        </div>
      </div>
    </li>
  );
}
