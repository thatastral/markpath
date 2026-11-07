import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { listIntegrations } from "@/server/db/repositories";
import { activeBrandForUser } from "@/server/workspace/active";
import { getOverviewData, switchRoomReplyCount } from "@/server/dashboard/service";
import { getGithubConfig } from "@/server/integrations/github";
import { getSetupData } from "@/server/dashboard/setup";
import { SetupOverview } from "@/components/setup-overview";
import { activityText, agentLabel, connectionLabel, providerName, whenText } from "@/lib/labels";

export default async function OverviewPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId);
  if (!brand) return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-2xl font-semibold">Create your first workspace</h1><p className="mt-2 text-muted">A workspace holds one brand: its rules, connections, chat room and history.</p><Link className="mt-5 inline-block rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white" href="/workspaces/new">Create a workspace</Link></main>;
  const integrations = listIntegrations(db, brand.id); const overview = getOverviewData(db, brand.id); const roomReplies = switchRoomReplyCount(db, brand.id); const gh = getGithubConfig(brand.id);
  const setup = await getSetupData(db, brand.id, userId);
  const metrics: Array<[string, number, string, string]> = [["Open issues", overview.findingCount, "/issues", "See the issues"], ["High priority", overview.criticalOrHighCount, "/issues?severity=high", "See high priority"], ["Waiting for approval", overview.pendingApprovalCount, "/issues", "Review and approve"], ["Fixes verified", overview.completedTaskCount, "/activity", "See what was done"]];
  const toolText = (provider: string, status: string, mode: string) => {
    if (provider === "switch") return roomReplies > 0 ? "Connected: agents have answered in your room" : "Not verified yet: no agent has answered in the room";
    if (provider === "github") return status === "connected" && gh?.repo ? `Connected to ${gh.repo}` : status === "connected" ? "Signed in, no repository chosen yet" : "Not connected";
    if (provider === "canva" && mode !== "mcp") return "Not set up";
    return connectionLabel(status);
  };
  return <main className="mx-auto max-w-5xl px-6 py-10">
    <p className="text-sm font-semibold text-brand">Workspace</p><h1 className="mt-2 text-3xl font-semibold">{brand.name}</h1>
    {brand.description && <p className="mt-2 max-w-2xl text-muted">{brand.description}</p>}
    <p className="mt-1 text-sm text-muted">Your approved brand rules are version {brand.brand_version}.</p>
    {overview.pendingApprovalCount > 0 && <Link className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-brand bg-surface p-4 font-medium" href="/issues"><span>{overview.pendingApprovalCount === 1 ? "1 change is waiting for your approval" : `${overview.pendingApprovalCount} changes are waiting for your approval`}</span><span className="text-brand underline">Review and approve</span></Link>}
    <SetupOverview setup={setup} />
    <section aria-label="At a glance" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value, href, cta]) => <Link aria-label={`${label}: ${value}. ${cta}`} className="rounded-lg border border-border bg-surface p-4" href={href} key={label}><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></Link>)}</section>
    <section className="mt-10"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">Your tools</h2><Link className="text-sm underline" href="/integrations">Manage connections</Link></div><ul className="mt-4 grid gap-3 sm:grid-cols-2">{integrations.map((i) => <li className="rounded-lg border border-border bg-surface p-4" key={i.provider}><p className="font-medium">{providerName(i.provider)}</p><p className="mt-1 text-sm text-muted">{toolText(i.provider, i.connection_status, i.mode)}</p></li>)}</ul></section>
    <section className="mt-10"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">Recent activity</h2><Link className="text-sm underline" href="/activity">See all activity</Link></div><ul className="mt-4 grid gap-2">{overview.recentActivity.length === 0 ? <li className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">Nothing yet. Once the agents start working in your chat room, you will see it here.</li> : overview.recentActivity.map((e) => <li className="rounded-lg border border-border bg-surface p-4" key={e.id}><p><span className="font-medium">{agentLabel(e.agent_name)}</span> {activityText(e.activity_type, e.status)}</p><p className="mt-1 text-xs text-muted">{whenText(e.created_at)}</p></li>)}</ul></section>
  </main>;
}
