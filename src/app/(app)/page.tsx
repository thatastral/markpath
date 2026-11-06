import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { listIntegrations } from "@/server/db/repositories";
import { activeBrandForUser } from "@/server/workspace/active";
import { getOverviewData, switchRoomReplyCount } from "@/server/dashboard/service";
import { SetupChecklist, type SetupStep } from "@/components/setup-checklist";

export default async function OverviewPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase();
  initializeSchema(db);
  const brand = await activeBrandForUser(db, userId);
  if (!brand) return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">No workspace yet</h1><p className="mt-2 text-muted">Create or join a workspace to start brand operations.</p></main>;
  const integrations = listIntegrations(db, brand.id); const overview = getOverviewData(db, brand.id);
  const has = (sql: string) => (db.prepare(sql).get(brand.id) as { n: number }).n > 0;
  const steps: SetupStep[] = [
    { label: "Create your workspace", detail: "Done.", href: "/", done: true },
    { label: "Add and approve your brand rules", detail: "Upload the guideline and approve the rules Markpath extracted.", href: "/brand", done: brand.brand_version !== "0.0" },
    { label: "Set your chat handle", detail: "So you can approve changes by replying in the chat room.", href: "/integrations", done: has("SELECT COUNT(*) AS n FROM chat_identities WHERE brand_id = ?") },
    { label: "Connect your chat room", detail: "Copy the room template into Switch Console. Done once an agent has answered in the room.", href: "/integrations", done: switchRoomReplyCount(db, brand.id) > 0 },
    { label: "Run your first audit", detail: "Ask the Brand Director in the chat room to audit your brand.", href: "/activity", done: has("SELECT COUNT(*) AS n FROM tasks WHERE brand_id = ?") },
  ];
  const metrics = [["Connected platforms", overview.connectedPlatformCount], ["Open findings", overview.findingCount], ["Critical or high", overview.criticalOrHighCount], ["Pending approvals", overview.pendingApprovalCount], ["Verified outcomes", overview.completedTaskCount]];
  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold text-brand">Workspace</p><h1 className="mt-2 text-3xl font-semibold">{brand.name}</h1><p className="mt-2 max-w-2xl text-muted">{brand.description}</p><SetupChecklist steps={steps} /><p className="mt-1 text-sm text-muted">Approved brand version: {brand.brand_version}. Counts represent persisted evidence, not a synthetic health score.</p><section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(([label, value]) => <article className="rounded-lg border border-border bg-surface p-4" key={label as string}><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></article>)}</section><section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Onboarding</h2><p className="mt-1 text-sm text-muted">Complete the next verified step; no integration is assumed configured.</p></div><a className="rounded-[var(--radius-control)] bg-brand px-3 py-2 text-sm font-medium text-white" href="/brand">Review brand specification</a></div><ol className="mt-4 grid gap-3 md:grid-cols-3">{[["1", "Approve a brand specification", brand.brand_version !== "0.0"], ["2", "Configure platform connections", overview.connectedPlatformCount > 0], ["3", "Create a Switch room and verify an agent reply", false]].map(([number, label, complete]) => <li className="rounded-lg border border-border bg-surface p-4" key={number as string}><p className="text-sm font-semibold text-brand">Step {number as string}</p><p className="mt-1 font-medium">{label as string}</p><p className="mt-2 text-sm text-muted">{complete ? "Recorded" : "Still required"}</p></li>)}</ol></section><section className="mt-10"><h2 className="text-lg font-semibold">Integration status</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{integrations.map((integration) => <li className="rounded-lg border border-border bg-surface p-4" key={integration.provider}><p className="font-medium capitalize">{integration.provider}</p><p className="mt-1 text-sm text-muted">{integration.connection_status.replaceAll("_", " ")} · {integration.mode} mode</p></li>)}</ul></section><section className="mt-10"><h2 className="text-lg font-semibold">Recent agent activity</h2><div className="mt-4 grid gap-3">{overview.recentActivity.length === 0 ? <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">No operational activity has been recorded yet.</p> : overview.recentActivity.map((entry) => <article className="rounded-lg border border-border bg-surface p-4" key={entry.id}><p className="font-medium">{entry.agent_name} · {entry.status}</p><p className="mt-1 text-sm text-muted">{entry.activity_type.replaceAll("_", " ")}{entry.task_description ? ` · ${entry.task_description}` : ""}</p></article>)}</div></section></main>;
}
