import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findFirstBrandForUser } from "@/server/db/repositories";
import { getActivity } from "@/server/dashboard/service";

export default async function ActivityPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login"); const db = getDatabase(); initializeSchema(db); const brand = findFirstBrandForUser(db, userId); if (!brand) redirect("/");
  const activity = getActivity(db, brand.id);
  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold text-brand">Agent activity</p><h1 className="mt-2 text-3xl font-semibold">Operational record</h1><p className="mt-2 text-muted">Only persisted task, approval, and verification activity appears here; a chat mention alone is not treated as proof.</p><section className="mt-8 overflow-hidden rounded-lg border border-border bg-surface"><div className="divide-y divide-border">{activity.length === 0 ? <p className="p-5 text-muted">No agent activity has been recorded yet.</p> : activity.map((entry) => <article className="p-5" key={entry.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{entry.agent_name}</h2><p className="mt-1 text-sm text-muted">{entry.activity_type.replaceAll("_", " ")} · {entry.status}</p></div><time className="text-sm text-muted">{new Date(entry.created_at).toLocaleString()}</time></div>{entry.task_description && <p className="mt-3 text-sm">Task: {entry.task_description}</p>}{entry.message_reference && <p className="mt-1 text-sm text-muted">Switch reference: {entry.message_reference}</p>}</article>)}</div></section></main>;
}
