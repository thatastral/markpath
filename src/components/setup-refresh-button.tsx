"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshIcon, SpinnerIcon } from "@/components/ui/icons";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Re-reads every step's status, for after the person finished something in another app. */
export function SetupRefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checked, setChecked] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button className={`inline-flex min-h-10 lg:min-h-8 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-hover disabled:opacity-60 ${focus}`} disabled={pending} onClick={() => start(() => { router.refresh(); setChecked(true); })} type="button">{pending ? <SpinnerIcon /> : <RefreshIcon />}{pending ? "Checking…" : "Check again"}</button>
      <span aria-live="polite" className="text-sm text-muted" role="status">{!pending && checked ? "Statuses are up to date." : ""}</span>
    </span>
  );
}
