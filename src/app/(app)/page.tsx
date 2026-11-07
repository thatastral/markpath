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
import { AgentAvatar, Badge, buttonClass, cardClass, EmptyState, linkClass, PageHeader, SectionHeading, type Tone } from "@/components/ui/primitives";
import { ActivityIcon, ArrowRight, ChevronRight, ProviderIcon, ShieldIcon } from "@/components/ui/icons";

export default async function OverviewPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId);
  if (!brand) return <main className="anim-rise mx-auto max-w-4xl px-4 py-12 sm:px-6"><EmptyState action={<Link className={buttonClass("primary")} href="/workspaces/new">Create a workspace</Link>} icon={<ShieldIcon size={20} />} title="Create your first workspace">A workspace holds one brand: its rules, connections, chat room and history.</EmptyState></main>;
  const integrations = listIntegrations(db, brand.id); const overview = getOverviewData(db, brand.id); const roomReplies = switchRoomReplyCount(db, brand.id); const gh = getGithubConfig(brand.id);
  const setup = await getSetupData(db, brand.id, userId);
  const metrics: Array<[string, number, string, string]> = [["Open issues", overview.findingCount, "/issues", "See the issues"], ["High priority", overview.criticalOrHighCount, "/issues?severity=high", "See high priority"], ["Waiting for approval", overview.pendingApprovalCount, "/issues", "Review and approve"], ["Fixes verified", overview.completedTaskCount, "/activity", "See what was done"]];
  const toolText = (provider: string, status: string, mode: string) => {
    if (provider === "switch") return roomReplies > 0 ? "Connected: agents have answered in your room" : "Not verified yet: no agent has answered in the room";
    if (provider === "github") return status === "connected" && gh?.repo ? `Connected to ${gh.repo}` : status === "connected" ? "Signed in, no repository chosen yet" : "Not connected";
    if (provider === "canva" && mode !== "mcp") return "Not set up";
    return connectionLabel(status);
  };
  const toolTone = (provider: string, status: string): Tone => {
    if (provider === "switch") return roomReplies > 0 ? "success" : "neutral";
    if (provider === "github") return status === "connected" && gh?.repo ? "success" : status === "connected" ? "warning" : "neutral";
    return status === "connected" ? "success" : status === "error" ? "danger" : status === "configured" ? "brand" : "neutral";
  };
  return <main className="anim-rise mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader description={brand.description || undefined} eyebrow="Workspace" title={brand.name}>
      <p className="mt-3"><Badge tone="success">Brand rules version {brand.brand_version} approved</Badge></p>
    </PageHeader>
    {overview.pendingApprovalCount > 0 && <Link className="group mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-brand/40 bg-brand-soft p-4 shadow-card hover:border-brand sm:p-5" href="/issues">
      <span aria-hidden className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white"><ShieldIcon size={20} /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{overview.pendingApprovalCount === 1 ? "1 change is waiting for your approval" : `${overview.pendingApprovalCount} changes are waiting for your approval`}</span><span className="block text-sm text-muted">Nothing changes until you decide.</span></span>
      <span className={buttonClass("primary")}>Review and approve<ArrowRight /></span>
    </Link>}
    <SetupOverview setup={setup} />
    <section aria-label="At a glance" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value, href, cta], idx) => <Link aria-label={`${label}: ${value}. ${cta}`} className={`group ${cardClass} flex min-h-[7rem] flex-col justify-between p-4 hover:border-border-strong`} href={href} key={label}>
      <span className="flex items-center justify-between text-sm text-muted">{label}<ChevronRight className="opacity-0 transition-opacity duration-short ease-out-cubic group-hover:opacity-100 group-focus-visible:opacity-100" /></span>
      <span className={`text-3xl font-semibold tabular-nums tracking-tight ${idx === 1 && value > 0 ? "text-danger" : idx === 2 && value > 0 ? "text-brand" : idx === 3 && value > 0 ? "text-success" : ""}`}>{value}</span>
    </Link>)}</section>
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      <section aria-labelledby="tools-heading">
        <SectionHeading action={<Link className={linkClass + " text-sm"} href="/integrations">Manage<ChevronRight /></Link>} id="tools-heading" title="Your tools" />
        <ul className={`mt-3 divide-y divide-border ${cardClass}`}>{integrations.map((i) => <li className="flex items-center gap-3 px-4 py-3" key={i.provider}>
          <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink"><ProviderIcon provider={i.provider} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{providerName(i.provider)}</span><span className="block text-sm text-muted">{toolText(i.provider, i.connection_status, i.mode)}</span></span>
          <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${({ success: "bg-success", warning: "bg-warning", danger: "bg-danger", brand: "bg-brand", neutral: "bg-border-strong" } as Record<Tone, string>)[toolTone(i.provider, i.connection_status)]}`} />
        </li>)}</ul>
      </section>
      <section aria-labelledby="recent-heading">
        <SectionHeading action={<Link className={linkClass + " text-sm"} href="/activity">See all<ChevronRight /></Link>} id="recent-heading" title="Recent activity" />
        {overview.recentActivity.length === 0 ? <div className="mt-3"><EmptyState icon={<ActivityIcon size={20} />} title="Nothing yet">Once the agents start working in your chat room, you will see it here.</EmptyState></div>
          : <ul className={`mt-3 divide-y divide-border ${cardClass}`}>{overview.recentActivity.map((e) => <li className="flex items-start gap-3 px-4 py-3" key={e.id}>
            <AgentAvatar name={e.agent_name} />
            <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="min-w-0 text-sm"><span className="font-medium">{agentLabel(e.agent_name)}</span> <span className="text-muted">{activityText(e.activity_type, e.status)}</span></p>
              <time className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted" dateTime={e.created_at}>{whenText(e.created_at)}</time>
            </div>
          </li>)}</ul>}
      </section>
    </div>
  </main>;
}
