"use client";
import { useState } from "react";

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
      <code className="max-w-full rounded border border-border bg-canvas px-2 py-1">{value}</code>
      <button aria-label={`Copy ${label}`} className={`min-h-10 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm font-medium ${focus}`} onClick={copy} type="button">Copy</button>
      <span aria-live="polite" className="text-sm text-green-800" role="status">{status}</span>
    </span>
  );
}
