"use client";
import { useState } from "react";

export function CopyRoomTemplate() {
  const [state, setState] = useState<{ kind: "idle" | "working" | "done" | "error"; message?: string }>({ kind: "idle" });
  async function copy(rotate = false) {
    if (rotate && !window.confirm("Rotating replaces every agent key. Existing agents in Switch Console will stop working until you paste the new template. Continue?")) return;
    setState({ kind: "working" });
    try {
      const response = await fetch("/api/room-template", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rotate }) });
      if (!response.ok) throw new Error(((await response.json().catch(() => ({}))) as { error?: string }).error ?? `Request failed (${response.status}).`);
      await navigator.clipboard.writeText(await response.text());
      setState({ kind: "done", message: response.headers.get("X-Keys-Rotated") === "true" ? "Copied with NEW keys. Any existing agents stop working until you paste this template into Switch Console." : "Copied. These are the same keys as before, so agents already running in Switch Console keep working." });
    } catch (error) { setState({ kind: "error", message: error instanceof Error ? error.message : "Could not generate the template." }); }
  }
  return <div><button className="inline-flex min-h-10 lg:min-h-8 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-hover disabled:opacity-60" disabled={state.kind === "working"} onClick={() => copy(false)} type="button">{state.kind === "working" ? "Generating…" : "Copy chat-room template"}</button> <button className="ml-1 inline-flex min-h-10 lg:min-h-8 items-center rounded-control px-3 text-sm font-medium text-muted hover:bg-hover hover:text-ink disabled:opacity-60" disabled={state.kind === "working"} onClick={() => copy(true)} type="button">Rotate keys</button>{state.message && <p className={`anim-rise mt-2 text-sm ${state.kind === "error" ? "text-danger" : "text-muted"}`} role="status">{state.message}</p>}</div>;
}
