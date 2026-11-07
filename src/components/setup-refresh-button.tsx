"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshIcon, SpinnerIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/primitives";

/**
 * Re-reads every step's status, for after the person finished something in another app.
 * `waiting` is what to say when the check found nothing new (for example no reply in the room yet).
 */
export function SetupRefreshButton({ waiting = "Checked just now. Nothing new yet." }: { waiting?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checked, setChecked] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button aria-busy={pending || undefined} className={buttonClass("secondary")} disabled={pending} onClick={() => start(() => { router.refresh(); setChecked(true); })} type="button"><span className="grid"><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${pending ? "invisible" : ""}`}><RefreshIcon size={14} />Check again</span><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${pending ? "" : "invisible"}`}><SpinnerIcon size={14} />Checking…</span></span></button>
      <span aria-live="polite" className="text-sm text-muted" role="status">{!pending && checked ? waiting : ""}</span>
    </span>
  );
}
