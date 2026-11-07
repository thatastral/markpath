"use client";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/primitives";

/** Shows a value the person must paste somewhere else, with a Copy button and a spoken "Copied" status. */
export function SetupCopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus("Copied"); }
    catch { setStatus("Couldn't copy. Select the text and copy it yourself."); }
    setTimeout(() => setStatus(""), 2000);
  }
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded-[5px] border border-border bg-subtle px-1.5 py-0.5 font-mono text-xs">{value}</code>
      <button aria-label={`Copy ${label}`} className={buttonClass("secondary")} onClick={copy} type="button"><span className="grid"><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${status === "Copied" ? "invisible" : ""}`}><CopyIcon size={14} />Copy</span><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${status === "Copied" ? "" : "invisible"}`}><CheckIcon className="text-success" size={14} />Copied</span></span></button>
      <span aria-live="polite" className={`text-sm ${status === "Copied" ? "sr-only" : "text-muted"}`} role="status">{status}</span>
    </span>
  );
}
