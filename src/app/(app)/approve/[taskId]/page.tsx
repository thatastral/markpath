import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { getTaskApprovalView } from "@/server/dashboard/service";
import { describeApproval, taskStatusName } from "@/lib/labels";
import { decideTask } from "./actions";

const uuid = /^[0-9a-f-]{36}$/i;
export default async function ApprovePage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params; if (!uuid.test(taskId)) notFound();
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const view = getTaskApprovalView(db, taskId, userId); if (!view) notFound();
  const pending = view.items.filter((item) => item.decision === "pending").length;
  const rejected = view.items.some((i) => i.decision === "rejected");
  return <main className="mx-auto max-w-2xl px-6 py-10">
    <p className="text-sm font-semibold text-brand">Approval requested in the chat room</p>
    <h1 className="mt-2 text-2xl font-semibold">{pending > 0 ? "Review and approve these changes" : rejected ? "These changes were rejected" : "These changes are approved"}</h1>
    <p className="mt-2 text-sm text-muted">Request status: {taskStatusName(view.task.status).toLowerCase()}. Each approval covers one tool and exactly the changes listed. Nothing else is touched.</p>
    <section aria-label="Changes" className="mt-6 grid gap-4">{view.items.map((item) => { const v = describeApproval(item.approved_action, item.resource_name, item.resource_ref); return <article className="rounded-lg border border-border bg-surface p-5" key={item.id}>
      <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold">{v.heading}</h2><span className="text-sm text-muted">{item.decision === "pending" ? "Waiting for you" : item.decision === "approved" ? "Approved" : "Rejected"}</span></div>
      <p className="mt-2">{v.summary}</p><p className="mt-2 text-sm text-muted">{v.whatHappens}</p>
      {item.needsPerson > 0 && <p className="mt-2 text-sm text-muted">Not part of this approval: {item.needsPerson === 1 ? "1 other item needs" : `${item.needsPerson} other items need`} a person to decide (for example contrast or wording). See <Link className="underline" href="/issues?view=person">Needs a person</Link>.</p>}
    </article>; })}</section>
    {pending > 0 ? view.isOwner ? <form action={decideTask} className="mt-6 flex flex-wrap gap-3"><input name="taskId" type="hidden" value={view.task.id} />
      <button className="rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white" name="decision" type="submit" value="approved">{pending === 1 ? "Approve this change" : `Approve all ${pending} changes`}</button>
      <button className="rounded-[var(--radius-control)] border border-border px-4 py-2 text-sm font-medium" name="decision" type="submit" value="rejected">Reject</button></form>
      : <p className="mt-6 text-sm text-muted">Only the workspace owner can decide these approvals.</p>
      : <p className="mt-6 text-sm font-medium">{rejected ? "Nothing was changed." : "The agents continue in the chat room."} <Link className="font-normal underline" href="/issues">Back to issues</Link></p>}
  </main>;
}
