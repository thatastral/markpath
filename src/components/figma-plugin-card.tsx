"use client";
import { useState } from "react";

import { buttonClass } from "@/components/ui/primitives";

export function FigmaPluginCard() {
  const [state, setState] = useState<{ busy: boolean; message?: string; error?: string }>({ busy: false });
  async function copy(rotate: boolean) {
    if (rotate && !window.confirm("Make a new plugin key? The old key stops working until you paste the new one into the plugin.")) return;
    setState({ busy: true });
    try {
      const response = await fetch("/api/integrations/figma/plugin-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rotate }) });
      const data = await response.json() as { key?: string; error?: string }; if (!response.ok || !data.key) throw new Error(data.error ?? "Couldn't get the key. Try again.");
      await navigator.clipboard.writeText(data.key); setState({ busy: false, message: rotate ? "New key copied. Paste it into the plugin. The old key no longer works." : "Key copied. Paste it into the Markpath plugin in Figma." });
    } catch (e) { setState({ busy: false, error: e instanceof Error ? e.message : "Couldn't copy the key. Try again." }); }
  }
  return <div className="mt-4 grid gap-2 text-sm"><p className="text-muted">The plugin runs in your own Figma session, so there&apos;s no Figma sign-in to grant. In Figma, open Plugins, then Development, then Import plugin from manifest, and choose <code>figma-plugin/manifest.json</code> from the Markpath repository. Then copy your key and paste it into the plugin.</p>
    <div className="flex flex-wrap items-center gap-2"><button aria-busy={state.busy || undefined} className={buttonClass("secondary")} disabled={state.busy} onClick={() => copy(false)} type="button">Copy plugin key</button><button className={buttonClass("ghost")} disabled={state.busy} onClick={() => copy(true)} type="button">Make a new key</button></div>
    {state.message && <p className="anim-rise text-muted" role="status">{state.message}</p>}{state.error && <p className="text-danger" role="alert">{state.error}</p>}</div>;
}
