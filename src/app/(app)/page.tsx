import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserById, listIntegrations } from "@/server/db/repositories";
import { activeBrandForUser } from "@/server/workspace/active";
import { getApprovals, getOverviewData, switchRoomReplyCount } from "@/server/dashboard/service";
import { getGithubConfig } from "@/server/integrations/github";
import { getSetupData } from "@/server/dashboard/setup";
import { SetupOverview } from "@/components/setup-overview";
import { activityText, agentLabel, connectionLabel, describeApproval, providerName, whenText } from "@/lib/labels";
import { AgentAvatar, buttonClass, cardClass, EmptyState, linkClass, PageHeader, SectionHeading, StatusIcon, type Tone } from "@/components/ui/primitives";
import { ActivityIcon, ChevronRight, ProviderIcon, ShieldIcon } from "@/components/ui/icons";

export default async function OverviewPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId);
  if (!brand) return <main className="anim-rise"><PageHeader title="Welcome to Markpath" /><EmptyState action={<Link className={buttonClass("primary")} href="/workspaces/new">Create a workspace</Link>} icon={<ShieldIcon size={28} />} title="Create your first workspace">A workspace holds one brand: its rules, tools, chat room and history.</EmptyState></main>;
  const integrations = listIntegrations(db, brand.id); const overview = getOverviewData(db, brand.id); const roomReplies = switchRoomReplyCount(db, brand.id); const gh = getGithubConfig(brand.id);
  const setup = await getSetupData(db, brand.id, userId);
  const metrics: Array<[string, number, string, string]> = [["Open issues", overview.findingCount, "/issues", "See the issues"], ["High priority", overview.criticalOrHighCount, "/issues?severity=high", "See high priority"], ["Waiting for approval", overview.pendingApprovalCount, "/issues", "Review and approve"], ["Fixes verified", overview.completedTaskCount, "/activity", "See what was done"]];
  const toolText = (provider: string, status: string, mode: string) => {
    if (provider === "switch") return roomReplies > 0 ? "Connected. Agents reply in your room" : "Waiting for the first agent reply";
    if (provider === "github") return status === "connected" && gh?.repo ? `Connected to ${gh.repo}` : status === "connected" ? "Signed in. Choose a repository" : "Not connected";
    if (provider === "canva" && mode !== "mcp") return "Not set up";
    return connectionLabel(status);
  };
  const toolTone = (provider: string, status: string): Tone => {
    if (provider === "switch") return roomReplies > 0 ? "success" : "neutral";
    if (provider === "github") return status === "connected" && gh?.repo ? "success" : status === "connected" ? "warning" : "neutral";
    return status === "connected" ? "success" : status === "error" ? "danger" : status === "configured" ? "brand" : "neutral";
  };
  const dot: Record<Tone, string> = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", brand: "bg-brand", neutral: "bg-faint" };
  const user = findUserById(db, userId); const first = (user?.name || "").trim().split(/\s+/)[0];
  const hasRules = Boolean(brand.brand_version && brand.brand_version !== "0.0" && brand.brand_specification && brand.brand_specification !== "{}");
  const hour = new Date().getHours(); const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const waiting = getApprovals(db, brand.id).filter((a) => a.decision === "pending");
  const byTask = new Map<string, typeof waiting>(); for (const a of waiting) byTask.set(a.task_id, [...(byTask.get(a.task_id) ?? []), a]);
  return <main className="anim-rise">
    <PageHeader actions={<Link className={buttonClass("secondary")} href="/brand"><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${hasRules ? "bg-success" : "bg-warning"}`} />{hasRules ? `Brand rules v${brand.brand_version}` : "Add brand rules"}</Link>} description={brand.description || "Your brand workspace at a glance."} title="Overview" />
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
    <h2 className="text-2xl font-semibold tracking-tight">{greeting}{first && first.toLowerCase() !== "demo" ? `, ${first}` : ""}.</h2>
    <p className="mt-1 text-sm text-muted">Here's what's happening in {brand.name}.</p>
    <nav aria-label="At a glance" className="mt-2 flex flex-wrap gap-x-1 text-sm text-muted">{metrics.map(([label, value, href, cta], idx) => <span className="inline-flex items-center" key={label}>{idx > 0 && <span aria-hidden className="mx-1.5 text-faint">·</span>}<Link aria-label={`${label}: ${value}. ${cta}`} className="inline-flex min-h-10 items-center gap-1 rounded-control hover:text-ink lg:min-h-6" href={href}><span className="font-medium tabular-nums text-ink">{value}</span> {label.toLowerCase()}</Link></span>)}</nav>

    <section aria-labelledby="decide-heading" className="mt-10">
      <SectionHeading action={<Link className={`${linkClass} text-sm`} href="/issues">All issues<ChevronRight size={14} /></Link>} count={overview.pendingApprovalCount} id="decide-heading" title="Needs your decision" />
      {byTask.size === 0 ? <div className={`mt-3 ${cardClass}`}><p className="flex items-center gap-3 px-4 py-4 text-sm text-muted"><StatusIcon kind="done" />Nothing needs your decision. Changes show up here when an agent asks you to approve.</p></div>
        : <ul className={`mt-3 divide-y divide-border overflow-hidden ${cardClass}`}>{[...byTask.entries()].map(([taskId, items]) => <li key={taskId}><Link className="row-link flex min-h-12 items-center gap-3 px-4 py-3 hover:bg-hover" href={`/approve/${taskId}`}>
          <StatusIcon kind="waiting" />
          <span className="min-w-0 flex-1">{(() => { const t = `${describeApproval(items[0].approved_action, items[0].resource_name, items[0].resource_ref).heading}${items.length > 1 ? ` and ${items.length - 1} more` : ""}`; return <span className="block truncate text-sm font-medium" title={t}>{t}</span>; })()}<span className="block text-xs text-muted">Brand Director asked {whenText(items[0].created_at)}</span></span>
          <span aria-hidden className={buttonClass("primary", "sm")}>Review</span>
        </Link></li>)}</ul>}
    </section>

    <SetupOverview setup={setup} />

    <section aria-labelledby="recent-heading" className="mt-10">
      <SectionHeading action={<Link className={`${linkClass} text-sm`} href="/activity">See all<ChevronRight size={14} /></Link>} id="recent-heading" title="Recent activity" />
      {overview.recentActivity.length === 0 ? <div className="mt-3"><EmptyState action={<Link className={buttonClass("secondary")} href="/integrations#step-5">Set up the chat room</Link>} framed icon={<ActivityIcon size={28} />} title="No activity yet">Agent work shows up here once your chat room is set up.</EmptyState></div>
        : <ul className={`mt-3 divide-y divide-border overflow-hidden ${cardClass}`}>{overview.recentActivity.map((e) => <li className="flex min-h-11 items-start gap-3 px-4 py-2.5" key={e.id}>
          <span className="mt-px"><AgentAvatar name={e.agent_name} /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="min-w-0 text-sm"><span className="font-medium">{agentLabel(e.agent_name)}</span> <span className="text-muted">{activityText(e.activity_type, e.status)}</span></p>
            <time className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted" dateTime={e.created_at}>{whenText(e.created_at)}</time>
          </div>
        </li>)}</ul>}
    </section>

    <section aria-labelledby="tools-heading" className="mt-10">
      <SectionHeading action={<Link className={`${linkClass} text-sm`} href="/integrations">Manage<ChevronRight size={14} /></Link>} id="tools-heading" title="Your tools" />
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{integrations.map((i) => <li className={`flex min-h-14 items-center gap-3 ${cardClass} px-4 py-3`} key={i.provider}>
        <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-border text-ink"><ProviderIcon provider={i.provider} size={16} /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{providerName(i.provider)}</span><span className="block truncate text-xs text-muted" title={toolText(i.provider, i.connection_status, i.mode)}>{toolText(i.provider, i.connection_status, i.mode)}</span></span>
        <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[toolTone(i.provider, i.connection_status)]}`} />
      </li>)}</ul>
    </section>
    </div>
  </main>;
}
