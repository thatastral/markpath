import { notFound, redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { getTaskApprovalView } from "@/server/dashboard/service";
import { decideTask } from "./actions";

const z = /^[0-9a-f-]{36}$/i;
export default async function ApprovePage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params; if (!z.test(taskId)) notFound();
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const view = getTaskApprovalView(db, taskId, userId); if (!view) notFound();
  const pending = view.items.filter((item) => item.decision === "pending").length;
  return <main className="mx-auto max-w-3xl px-6 py-10">
    <p className="text-sm font-semibold text-brand">Approval requested in chat</p>
    <h1 className="mt-2 text-2xl font-semibold">{view.task.description}</h1>
    <p className="mt-2 text-sm text-muted">Task status: {view.task.status.replaceAll("_", " ").toLowerCase()}. Each approval covers exactly one resource and operation. Nothing else is changed.</p>
    <section className="mt-6 grid gap-4">{view.items.map((item) => <article className="rounded-lg border border-border bg-surface p-5" key={item.id}>
      <div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{item.resource_name}</h2><span className="rounded-full border border-border px-2 py-1 text-xs font-medium capitalize">{item.decision}</span></div>
      <ul className="mt-3 space-y-1 text-sm">{item.findings.length ? item.findings.map((f, i) => <li key={i}><span className="font-medium">{f.rule_id.replaceAll("-", " ")}</span>: {f.detected_value} → {f.expected_value} <span className="text-muted">({f.severity})</span></li>) : <li className="text-muted">No open findings recorded for this resource.</li>}</ul>
      <p className="mt-3 text-xs text-muted">Executed as a local fixture simulation. No real GitHub or Figma file is changed.</p>
    </article>)}</section>
    {pending > 0 ? view.isOwner ? <form action={decideTask} className="mt-6 flex flex-wrap gap-3"><input name="taskId" type="hidden" value={view.task.id} />
      <button className="rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white" name="decision" type="submit" value="approved">Approve {pending === 1 ? "this operation" : `all ${pending} operations`}</button>
      <button className="rounded-[var(--radius-control)] border border-border px-4 py-2 text-sm font-medium" name="decision" type="submit" value="rejected">Reject</button></form>
      : <p className="mt-6 text-sm text-muted">Only the workspace owner can decide these approvals.</p>
      : <p className="mt-6 text-sm font-medium">All operations on this task have been decided. The agents will continue in the chat room.</p>}
  </main>;
}
