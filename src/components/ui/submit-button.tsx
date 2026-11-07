"use client";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { SpinnerIcon } from "@/components/ui/icons";

/**
 * A submit button that shows its own pending state while its form's server action runs.
 * Both labels share one grid cell, so the button never changes width (no layout shift).
 * With `name`/`value`, only the button that was pressed shows the spinner; every button in the form is disabled.
 */
export function SubmitButton({ children, pendingLabel, className = "", name, value, title, autoFocus, disabled }: { children: ReactNode; pendingLabel?: ReactNode; className?: string; name?: string; value?: string; title?: string; autoFocus?: boolean; disabled?: boolean }) {
  const { pending, data } = useFormStatus();
  const mine = pending && (!name || data?.get(name) === value);
  return <button aria-busy={mine || undefined} autoFocus={autoFocus} className={className} disabled={pending || disabled} name={name} title={title} type="submit" value={value}>
    <span className="grid">
      <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 ${mine ? "invisible" : ""}`}>{children}</span>
      <span aria-hidden={!mine} className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 ${mine ? "" : "invisible"}`}><SpinnerIcon size={14} />{pendingLabel ?? "Working…"}</span>
    </span>
  </button>;
}
