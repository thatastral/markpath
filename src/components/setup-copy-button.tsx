"use client";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Shows a value the person must paste somewhere else, with a Copy button and a spoken "Copied" status. */
export function SetupCopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus("Copied"); }
    catch { setStatus("Couldn't copy. Select the text and copy it yourself."); }
    setTimeout(() => setStatus(""), 4000);
  }
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded-[5px] border border-border bg-subtle px-1.5 py-0.5 font-mono text-xs">{value}</code>
      <button aria-label={`Copy ${label}`} className={`inline-flex min-h-10 lg:min-h-8 items-center gap-1.5 rounded-control border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-hover ${focus}`} onClick={copy} type="button">{status === "Copied" ? <CheckIcon className="text-success" /> : <CopyIcon />}{status === "Copied" ? "Copied" : "Copy"}</button>
      <span aria-live="polite" className={`text-sm ${status === "Copied" ? "sr-only" : "text-muted"}`} role="status">{status}</span>
    </span>
  );
}
