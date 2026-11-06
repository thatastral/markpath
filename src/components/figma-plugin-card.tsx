"use client";
import { useState } from "react";

const button = "rounded-[var(--radius-control)] border border-border px-3 py-2 text-sm font-medium disabled:opacity-60";
export function FigmaPluginCard() {
  const [state, setState] = useState<{ busy: boolean; message?: string; error?: string }>({ busy: false });
  async function copy(rotate: boolean) {
    if (rotate && !window.confirm("Rotating makes the old key stop working. Paste the new key into the plugin. Continue?")) return;
    setState({ busy: true });
    try {
      const response = await fetch("/api/integrations/figma/plugin-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rotate }) });
      const data = await response.json() as { key?: string; error?: string }; if (!response.ok || !data.key) throw new Error(data.error ?? "Could not get the key.");
      await navigator.clipboard.writeText(data.key); setState({ busy: false, message: rotate ? "New key copied. The old one no longer works." : "Plugin key copied. Paste it into the Markpath plugin in Figma." });
    } catch (e) { setState({ busy: false, error: e instanceof Error ? e.message : "Could not copy the key." }); }
  }
  return <div className="mt-4 grid gap-2 text-sm"><p className="text-muted">Figma connects through the Markpath plugin, which runs inside your own Figma session, so there is no Figma login to grant. In Figma: Plugins, Development, Import plugin from manifest, then choose <code>figma-plugin/manifest.json</code> from the repository. Then copy your key and paste it into the plugin.</p>
    <div className="flex flex-wrap items-center gap-2"><button className={button} disabled={state.busy} onClick={() => copy(false)} type="button">Copy plugin key</button><button className="text-muted underline" disabled={state.busy} onClick={() => copy(true)} type="button">Rotate key</button></div>
    {state.message && <p className="text-muted" role="status">{state.message}</p>}{state.error && <p className="text-danger" role="alert">{state.error}</p>}</div>;
}
