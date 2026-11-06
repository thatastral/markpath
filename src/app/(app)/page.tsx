import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findFirstBrandForUser, listIntegrations } from "@/server/db/repositories";

export default async function OverviewPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase();
  initializeSchema(db);
  const brand = findFirstBrandForUser(db, userId);
  if (!brand) return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">No workspace yet</h1><p className="mt-2 text-muted">Create or join a workspace to start brand operations.</p></main>;
  const integrations = listIntegrations(db, brand.id);
  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold text-brand">Workspace</p><h1 className="mt-2 text-3xl font-semibold">{brand.name}</h1><p className="mt-2 max-w-2xl text-muted">{brand.description}</p><section className="mt-8"><h2 className="text-lg font-semibold">Integration status</h2><p className="mt-1 text-sm text-muted">These are placeholders only. No external connection has been validated.</p><ul className="mt-4 grid gap-3 sm:grid-cols-2">{integrations.map((integration) => <li className="rounded-lg border border-border bg-surface p-4" key={integration.provider}><p className="font-medium capitalize">{integration.provider}</p><p className="mt-1 text-sm text-muted">{integration.connection_status.replaceAll("_", " ")} · {integration.mode} mode</p></li>)}</ul></section></main>;
}
