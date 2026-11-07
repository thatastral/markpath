"use client";
import { useState } from "react";
import { CheckIcon, CopyIcon, SpinnerIcon } from "@/components/ui/icons";
import { buttonClass } from "@/components/ui/primitives";
import { CopyFallback, copyText } from "@/components/setup-copy-button";

export function CopyRoomTemplate({ autoFocus = false }: { autoFocus?: boolean }) {
  const [state, setState] = useState<{ kind: "idle" | "working" | "done" | "error"; rotate?: boolean; message?: string; text?: string }>({ kind: "idle" });
  async function copy(rotate = false) {
    if (rotate && !window.confirm("Make new agent keys? Agents already running in Switch Console stop working until you paste the new template there.")) return;
    setState({ kind: "working", rotate });
    try {
      const response = await fetch("/api/room-template", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rotate }) });
      if (!response.ok) throw new Error(((await response.json().catch(() => ({}))) as { error?: string }).error ?? `Couldn't make the template (error ${response.status}). Try again.`);
      const text = await response.text(); const rotated = response.headers.get("X-Keys-Rotated") === "true";
      if (!(await copyText(text))) { setState({ kind: "done", text, message: rotated ? "New keys made. Copy the template below and paste it into Switch Console so your agents keep working." : "Copy the template below and paste it into Switch Console." }); return; }
      setState({ kind: "done", message: rotated ? "Copied with new keys. Paste it into Switch Console so your agents keep working." : "Copied. Paste it into Switch Console. Your agent keys haven't changed." });
    } catch (error) { setState({ kind: "error", message: error instanceof Error ? error.message : "Couldn't copy the template. Try again." }); }
  }
  const working = state.kind === "working";
  return <div>
    <span className="flex flex-wrap items-center gap-2">
      <button aria-busy={(working && !state.rotate) || undefined} className={buttonClass("secondary")} data-autofocus={autoFocus || undefined} disabled={working} onClick={() => copy(false)} type="button">
        <span className="grid"><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${working && !state.rotate ? "invisible" : ""}`}>{state.kind === "done" && !state.text ? <CheckIcon className="text-success" size={14} /> : <CopyIcon size={14} />}Copy room template</span><span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${working && !state.rotate ? "" : "invisible"}`}><SpinnerIcon size={14} />Copying…</span></span>
      </button>
      <button className={buttonClass("ghost")} disabled={working} onClick={() => copy(true)} type="button">{working && state.rotate ? "Making new keys…" : "Make new keys"}</button>
    </span>
    {state.message && <p className={`anim-rise mt-2 text-sm ${state.kind === "error" ? "text-danger" : "text-muted"}`} role={state.kind === "error" ? "alert" : "status"}>{state.message}</p>}
    {state.text && <CopyFallback label="room template" rows={8} text={state.text} />}
  </div>;
}
