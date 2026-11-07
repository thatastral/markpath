"use client";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/primitives";

/** Tries the clipboard. Returns false when the browser blocks it (no permission, insecure page). */
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Fallback when the clipboard is blocked: the text in a read-only, pre-selected box to copy by hand. */
export function CopyFallback({ text, label, rows = 3 }: { text: string; label: string; rows?: number }) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [mac, setMac] = useState(true);
  useEffect(() => { setMac(isMac()); box.current?.focus(); box.current?.select(); }, [text]);
  return <div className="anim-rise mt-2 grid w-full gap-1.5">
    <label className="text-xs text-muted" htmlFor={`copy-fallback-${label.replace(/\W+/g, "-")}`}>Couldn&apos;t copy automatically. Press {mac ? "Cmd+C" : "Ctrl+C"} to copy the {label}.</label>
    <textarea className="w-full min-w-0 resize-y rounded-control border border-border-strong bg-subtle px-2.5 py-1.5 font-mono text-xs text-ink" id={`copy-fallback-${label.replace(/\W+/g, "-")}`} onFocus={(e) => e.currentTarget.select()} readOnly ref={box} rows={rows} spellCheck={false} value={text} />
  </div>;
}

/** Shows a value the person must paste somewhere else, with a Copy button and a spoken "Copied" status. */
export function SetupCopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<"" | "copied" | "blocked">("");
  async function copy() {
    if (await copyText(value)) { setStatus("copied"); setTimeout(() => setStatus((s) => (s === "copied" ? "" : s)), 2000); }
    else setStatus("blocked");
  }
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded-[5px] border border-border bg-subtle px-1.5 py-0.5 font-mono text-xs">{value}</code>
      <button aria-label={`Copy ${label}`} className={buttonClass("secondary")} onClick={copy} type="button"><span className="grid"><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${status === "copied" ? "invisible" : ""}`}><CopyIcon size={14} />Copy</span><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${status === "copied" ? "" : "invisible"}`}><CheckIcon className="text-success" size={14} />Copied</span></span></button>
      <span aria-live="polite" className="sr-only" role="status">{status === "copied" ? "Copied" : ""}</span>
      {status === "blocked" && <CopyFallback label={label} rows={1} text={value} />}
    </span>
  );
}
