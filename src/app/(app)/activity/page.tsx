import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getActivity } from "@/server/dashboard/service";
import { activityText, agentLabel, whenText, withCanvaLabels } from "@/lib/labels";

export default async function ActivityPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const rows = getActivity(db, brand.id, 60);
  return <main className="mx-auto max-w-4xl px-6 py-10"><p className="text-sm font-semibold text-brand">Activity</p><h1 className="mt-2 text-3xl font-semibold">What the agents have done</h1><p className="mt-2 max-w-2xl text-muted">A record of requests, approvals, changes and checks. Newest first.</p>
    {rows.length === 0 ? <p className="mt-8 rounded-lg border border-border bg-surface p-5 text-muted">No activity yet. Ask the Brand Director something in your chat room and it will appear here.</p> : <ol className="mt-6 grid gap-2">{rows.map((r) => <li className="rounded-lg border border-border bg-surface p-4" key={r.id}>
      <p><span className="font-medium">{agentLabel(r.agent_name)}</span> {activityText(r.activity_type, r.status)}</p>
      {r.task_description && <p className="mt-1 text-sm text-muted">{withCanvaLabels(r.task_description)}</p>}
      <p className="mt-1 text-xs text-muted">{whenText(r.created_at)}</p>
      {r.message_reference && <details className="mt-1 text-xs text-muted"><summary className="cursor-pointer">Technical details</summary><p className="mt-1 break-all">Chat message: {r.message_reference}</p></details>}
    </li>)}</ol>}
    {rows.length === 60 && <p className="mt-4 text-sm text-muted">Showing the latest 60 entries.</p>}
  </main>;
}
