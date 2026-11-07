import type { ReactNode } from "react";
import { setupStatusLabel, type SetupStatus, type SetupStep } from "@/server/dashboard/setup";
import { Badge, buttonClass, inputClass, type Tone } from "@/components/ui/primitives";
import { ChevronRight, ClockIcon } from "@/components/ui/icons";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const setupUi = {
  focus,
  primary: buttonClass("primary"),
  secondary: buttonClass("secondary"),
  input: inputClass,
};

const tone: Record<SetupStatus, Tone> = { done: "success", needs_you: "brand", optional: "neutral", not_started: "neutral" };

export function SetupStatusBadge({ status }: { status: SetupStatus }) {
  return <Badge tone={tone[status]}>{setupStatusLabel[status]}</Badge>;
}

export function SetupCheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg aria-hidden className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

/** Stepper marker: number, accent ring when it needs you, success check when done. */
export function SetupMarker({ step, small = false }: { step: SetupStep; small?: boolean }) {
  const dims = small ? "mt-0.5 h-4 w-4 text-[9px]" : "h-6 w-6 text-2xs";
  return step.status === "done"
    ? <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full bg-success text-surface ${dims}`}><SetupCheckIcon className={small ? "h-2.5 w-2.5" : "h-3 w-3"} /></span>
    : <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums ${dims} ${step.status === "needs_you" ? "border-brand bg-brand-soft text-brand" : "border-border-strong text-muted"}`}>{step.n}</span>;
}

/** One step row in the setup stepper. Done steps collapse to a single "Working" line with a Change disclosure. */
export function SetupStepCard({ step, children, note }: { step: SetupStep; children?: ReactNode; note?: ReactNode }) {
  const title = <><span className="sr-only">Step {step.n}: </span>{step.title}</>;
  const body = <>
    <p className="text-sm text-muted">{step.why}</p>
    <dl className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
      <div className="min-w-0 flex-1 basis-64"><dt className="inline font-medium">What you&apos;ll need: </dt><dd className="inline text-muted">{step.needs}</dd></div>
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted"><dt className="sr-only">Time</dt><ClockIcon size={13} /><dd>{step.time}</dd></div>
    </dl>
    {note && <p className="mt-3 border-l-2 border-border-strong pl-3 text-sm text-muted">{note}</p>}
    {step.next && <p className="mt-3 flex items-start gap-1.5 text-sm font-medium"><ChevronRight className="mt-0.5 shrink-0 text-brand" size={14} />{step.next}</p>}
    {children && <div className="mt-4">{children}</div>}
  </>;

  if (step.status === "done") return (
    <li className="scroll-mt-24 border-b border-border last:border-b-0" id={`step-${step.n}`}>
      <details className="group">
        <summary className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 hover:bg-hover sm:px-5 ${focus}`}>
          <SetupMarker step={step} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-medium">{title}</h3>{step.optional && <span className="text-xs text-muted">Optional</span>}</span>
            <span className="text-xs text-muted"><span className="text-success">Working:</span> {step.evidence}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted group-hover:text-ink"><span className="group-open:hidden">Change</span><span className="hidden group-open:inline">Close</span><ChevronRight className="chev" size={14} /></span>
        </summary>
        <div className="px-4 pb-5 sm:pl-14 sm:pr-5">{body}</div>
      </details>
    </li>
  );

  const current = step.status === "needs_you";
  return (
    <li className={`relative scroll-mt-24 border-b border-border px-4 py-4 last:border-b-0 sm:px-5 ${current ? "bg-subtle" : ""}`} id={`step-${step.n}`}>
      {current && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />}
      <div className="flex items-start gap-3">
        <SetupMarker step={step} />
        <div className="min-w-0 flex-1">
          <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-semibold">{title}</h3><SetupStatusBadge status={step.status} /></div>
          <div className="mt-1.5">{body}</div>
        </div>
      </div>
    </li>
  );
}
