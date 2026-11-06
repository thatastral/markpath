import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findFirstBrandForUser } from "@/server/db/repositories";
import { getIntegrations } from "@/server/dashboard/service";
import { HttpSwitchClient } from "@/server/switch/client";

const display = (value: string) => value.replaceAll("_", " ");

export default async function IntegrationsPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = findFirstBrandForUser(db, userId); if (!brand) redirect("/");
  const [integrations, switchHealth] = await Promise.all([Promise.resolve(getIntegrations(db, brand.id)), new HttpSwitchClient().health()]);
  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold text-brand">Integrations</p><h1 className="mt-2 text-3xl font-semibold">Connection status</h1><p className="mt-2 max-w-3xl text-muted">Status is evidence-led: fixtures are clearly labelled, and Switch is not marked connected until a room agent has replied.</p><section className="mt-8 grid gap-4 md:grid-cols-2">{integrations.map((integration) => <article className="rounded-lg border border-border bg-surface p-5" key={integration.provider}><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold capitalize">{integration.provider}</h2><span className="rounded-full border border-border px-2 py-1 text-xs font-medium">{display(integration.connection_status)}</span></div><p className="mt-3 text-sm text-muted">Mode: {integration.mode}</p><p className="mt-1 text-sm text-muted">Last successful inspection: {integration.last_checked_at ? new Date(integration.last_checked_at).toLocaleString() : "not recorded"}</p>{integration.provider === "switch" && <div className="mt-4 rounded-[var(--radius-control)] border border-border p-3 text-sm"><p className="font-medium">Server health: {switchHealth.connected ? "reachable" : "unreachable"}</p><p className="mt-1 text-muted">{switchHealth.detail}</p><p className="mt-2 text-muted">Room reply verification: not yet recorded. Import <code>switch/markpath-ops.template.yaml</code> in Switch Console after starting its local server.</p></div>}{integration.provider === "figma" && <p className="mt-4 text-sm text-muted">The plugin is supplied for local Figma testing; it remains untested in Figma until run there.</p>}{integration.provider === "canva" && <p className="mt-4 text-sm text-muted">Canva is intentionally not connected in this MVP.</p>}</article>)}</section></main>;
}
