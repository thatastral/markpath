import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { getTaskApprovalView } from "@/server/dashboard/service";
import { describeApproval, taskStatusName } from "@/lib/labels";
import { AgentAvatar, Badge, buttonClass, cardClass, linkClass, PageHeader, StatusIcon } from "@/components/ui/primitives";
import { ChangeList } from "@/components/ui/change-list";
import { CheckIcon, ChevronRight, ShieldIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { decideTask } from "./actions";
import { switchWorkspace } from "../../actions";
import { activeBrandForUser } from "@/server/workspace/active";
import { pageTitle } from "../../page-title";
export async function generateMetadata({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params; const userId = await currentUserId();
  if (!userId || !/^[0-9a-f-]{36}$/i.test(taskId)) return { title: "Page not found · Markpath" };
  const db = getDatabase(); initializeSchema(db);
  return { title: getTaskApprovalView(db, taskId, userId) ? await pageTitle("Review changes") : "Page not found · Markpath" };
}

const uuid = /^[0-9a-f-]{36}$/i;
export default async function ApprovePage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params; if (!uuid.test(taskId)) notFound();
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const view = getTaskApprovalView(db, taskId, userId); if (!view) notFound();
  const active = await activeBrandForUser(db, userId);
  const elsewhere = active?.id !== view.task.brand_id ? (db.prepare("SELECT name FROM brands WHERE id = ?").get(view.task.brand_id) as { name: string } | undefined)?.name : undefined;
  const pending = view.items.filter((item) => item.decision === "pending").length;
  const rejected = view.items.some((i) => i.decision === "rejected");
  const state = pending > 0 ? "pending" : rejected ? "rejected" : "approved";
  return <main className="anim-rise">
    <PageHeader actions={<Badge tone={state === "pending" ? "brand" : state === "rejected" ? "danger" : "success"}>{taskStatusName(view.task.status)}</Badge>} description="The Brand Director asked for your approval in the chat room." title={pending > 0 ? "Review changes" : rejected ? "Changes rejected" : "Changes approved"} />
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
    {elsewhere && <form action={switchWorkspace} className={`mb-5 flex flex-wrap items-center justify-between gap-3 ${cardClass} px-4 py-3 text-sm`}><input name="brandId" type="hidden" value={view.task.brand_id} /><input name="next" type="hidden" value={`/approve/${view.task.id}`} /><span>This approval is in <span className="font-medium">{elsewhere}</span>, not the workspace you have open.</span><SubmitButton className={buttonClass("secondary", "sm")} pendingLabel="Switching…">Switch to {elsewhere}</SubmitButton></form>}
    <p className="flex items-start gap-2 text-sm text-muted"><ShieldIcon className="mt-0.5 shrink-0 text-muted" size={14} />You approve exactly the changes listed, one tool at a time. Nothing else changes.</p>
    <section aria-label="Changes" className="mt-5 grid gap-3">{view.items.map((item) => { const v = describeApproval(item.approved_action, item.resource_name, item.resource_ref); return <article className={`relative overflow-hidden ${cardClass} p-4 sm:p-5`} key={item.id}>
      {item.decision === "pending" && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />}
      <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold tracking-tight"><AgentAvatar name="Brand Director" />{v.heading}</h2><Badge tone={item.decision === "pending" ? "brand" : item.decision === "approved" ? "success" : "danger"}>{item.decision === "pending" ? "Waiting for you" : item.decision === "approved" ? "Approved" : "Rejected"}</Badge></div>
      <p className="mt-2 text-sm">{v.summary}</p>
      {v.changes.length > 0 && <div className="mt-3"><ChangeList changes={v.changes} /></div>}
      <p className="mt-3 text-sm text-muted">{v.whatHappens}</p>
      {item.needsPerson > 0 && <p className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-sm text-muted"><StatusIcon className="mt-0.5" kind="person" /><span><span className="tabular-nums">{item.needsPerson}</span> other {item.needsPerson === 1 ? "item needs" : "items need"} your judgement, like contrast or wording. They aren&apos;t part of this approval. <Link className="font-medium text-ink underline underline-offset-4" href="/issues?view=person">See them</Link></span></p>}
    </article>; })}</section>
    {pending > 0 ? view.isOwner ? <form action={decideTask} className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap gap-2 border-t border-border bg-surface px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"><input name="taskId" type="hidden" value={view.task.id} />
      <SubmitButton className={buttonClass("primary")} name="decision" pendingLabel="Approving…" value="approved"><CheckIcon size={14} />{pending === 1 ? "Approve change" : <>Approve all <span className="tabular-nums">{pending}</span> changes</>}</SubmitButton>
      <SubmitButton className={buttonClass("danger")} name="decision" pendingLabel="Rejecting…" value="rejected">Reject</SubmitButton></form>
      : <p className="mt-6 text-sm text-muted">Only the workspace owner can approve or reject these changes.</p>
      : <p className="mt-6 flex flex-wrap items-center gap-x-2 text-sm font-medium">{rejected ? "Nothing was changed." : "The agents take it from here. Follow along in the chat room."} <Link className={linkClass} href="/issues">Back to issues<ChevronRight size={14} /></Link></p>}
    </div>
  </main>;
}
