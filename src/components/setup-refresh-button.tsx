"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Re-reads every step's status, for after the person finished something in another app. */
export function SetupRefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checked, setChecked] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button className={`min-h-10 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm font-medium disabled:opacity-60 ${focus}`} disabled={pending} onClick={() => start(() => { router.refresh(); setChecked(true); })} type="button">{pending ? "Checking…" : "Check again"}</button>
      <span aria-live="polite" className="text-sm text-muted" role="status">{!pending && checked ? "Statuses are up to date." : ""}</span>
    </span>
  );
}
