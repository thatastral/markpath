import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getApprovals, getFindings, type ApprovalRow } from "@/server/dashboard/service";
import { describeApproval, groupFindings, providerName, resourceLabel, ruleName, severityName, whenText } from "@/lib/labels";
import { AgentAvatar, Badge, buttonClass, cardClass, ChangeArrow, Count, EmptyState, GroupBand, PageHeader, rowClass, SectionHeading, SeverityIcon, severityTone, StatusIcon, ValuePill } from "@/components/ui/primitives";
import { CheckIcon, ChevronRight, InboxIcon, ProviderIcon, SearchIcon } from "@/components/ui/icons";
import { ChangeList } from "@/components/ui/change-list";
import { decideTask } from "../approve/[taskId]/actions";
import { decideDashboardApproval } from "./actions";

type PageProps = { searchParams: Promise<{ provider?: string; severity?: string; view?: string }> };
const chip = "inline-flex min-h-10 items-center rounded-control border px-2.5 text-sm font-medium lg:min-h-7";
const primary = buttonClass("primary");
const secondary = buttonClass("danger");
const decisionName = (d: string) => ({ approved: "Approved", rejected: "Rejected", pending: "Waiting for you" } as Record<string, string>)[d] ?? `${d.charAt(0).toUpperCase()}${d.slice(1).replaceAll("_", " ").toLowerCase()}`;
const via = (c: string | null) => (c === "chat_relayed" ? "by a chat reply" : c === "dashboard" ? "in the dashboard" : "");

export default async function IssuesPage({ searchParams }: PageProps) {
  const userId = await currentUserId(); if (!userId) redirect("/login"); const filters = await searchParams;
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const findings = getFindings(db, brand.id, { provider: filters.provider, severity: filters.severity, status: "open", classification: filters.view === "person" ? "needs_review" : undefined });
  const groups = groupFindings(findings);
  const approvals = getApprovals(db, brand.id); const pending = approvals.filter((a) => a.decision === "pending"); const decided = approvals.filter((a) => a.decision !== "pending");
  const pendingByTask = new Map<string, ApprovalRow[]>(); for (const a of pending) pendingByTask.set(a.task_id, [...(pendingByTask.get(a.task_id) ?? []), a]);
  const active = (k: "provider" | "severity" | "view", v: string) => filters[k] === v;
  const filtered = Boolean(filters.provider || filters.severity || filters.view);
  const links: Array<[string, string, boolean]> = [["All", "/issues", !filtered], ["GitHub", "/issues?provider=github", active("provider", "github")], ["Figma", "/issues?provider=figma", active("provider", "figma")], ["Canva", "/issues?provider=canva", active("provider", "canva")], ["High priority", "/issues?severity=high", active("severity", "high")], ["Needs a person", "/issues?view=person", active("view", "person")]];

  const byProvider = new Map<string, typeof groups>(); for (const g of groups) { const k = g.provider ?? "other"; byProvider.set(k, [...(byProvider.get(k) ?? []), g]); }
  const totalPlaces = groups.reduce((n, g) => n + g.count, 0);

  const pad = "px-4 sm:px-6 lg:px-8";
  return <main className="anim-rise">
    <PageHeader description="Open issues across your connected tools, and the changes waiting for your decision. Nothing is changed until you approve it here or by replying in the chat room." title="Issues & approvals" />

    {pending.length > 0 && <section aria-labelledby="waiting" className={`${pad} border-b border-border py-6`}>
      <SectionHeading count={pending.length} description="Approve here, or reply “approve” to the Brand Director in the chat room." id="waiting" title="Waiting for your approval" />
      <div className="mt-4 grid max-w-3xl gap-3">{[...pendingByTask.entries()].map(([taskId, items]) => <div className={`relative overflow-hidden ${cardClass}`} key={taskId}>
        <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-brand-solid" />
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 text-sm sm:px-5"><AgentAvatar name="Brand Director" /><span className="font-medium">Brand Director</span><span className="text-muted">asked for approval</span><Badge className="ml-auto" tone="brand">Waiting for you</Badge></div>
        <div className="divide-y divide-border">{items.map((a) => { const v = describeApproval(a.approved_action, a.resource_name, a.resource_ref); return <article className="grid gap-2.5 px-4 py-4 sm:px-5" key={a.id}>
          <h3 className="text-base font-semibold tracking-tight">{v.heading}</h3><p className="text-sm">{v.summary}</p>
          {v.changes.length > 0 && <ChangeList changes={v.changes} />}
          <p className="text-sm text-muted">{v.whatHappens}</p>
          {items.length === 1 && <div className="mt-1 flex flex-wrap gap-2"><form action={decideDashboardApproval.bind(null, a.id, "approved")}><button className={primary} type="submit"><CheckIcon size={14} />Approve these changes</button></form><form action={decideDashboardApproval.bind(null, a.id, "rejected")}><button className={secondary} type="submit">Reject</button></form></div>}
        </article>; })}</div>
        {items.length > 1 && <form action={decideTask} className="flex flex-wrap gap-2 border-t border-border bg-subtle px-4 py-3 sm:px-5"><input name="taskId" type="hidden" value={taskId} /><button className={primary} name="decision" type="submit" value="approved"><CheckIcon size={14} />Approve all {items.length} changes</button><button className={secondary} name="decision" type="submit" value="rejected">Reject all</button></form>}
      </div>)}</div>
    </section>}

    <section aria-labelledby="open">
      <div className={`${pad} flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border py-2.5`}>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold" id="open">Open issues<Count>{groups.length}</Count></h2>
        <nav aria-label="Filter issues" className="flex flex-wrap gap-1">{links.map(([label, href, on]) => <Link aria-current={on ? "page" : undefined} className={`${chip} ${on ? "border-border-strong bg-hover text-ink" : "border-transparent text-muted hover:bg-hover hover:text-ink"}`} href={href} key={label}>{label}</Link>)}</nav>
        {groups.length > 0 && <p className="ml-auto text-xs text-muted"><span className="tabular-nums">{groups.length}</span> {groups.length === 1 ? "issue" : "issues"} in <span className="tabular-nums">{totalPlaces}</span> {totalPlaces === 1 ? "place" : "places"}</p>}
      </div>
      {groups.length === 0 ? (filtered
        ? <EmptyState action={<Link className={buttonClass("secondary")} href="/issues">Clear filters</Link>} icon={<SearchIcon size={28} />} title="No open issues match this filter">Try another filter, or clear it to see everything.</EmptyState>
        : <EmptyState action={<><Link className={buttonClass("primary")} href="/integrations">Run a check</Link><Link className={buttonClass("secondary")} href="/reviews">See reviews</Link></>} icon={<InboxIcon size={28} />} title="No open issues">Ask the Brand Director in your chat room to check your designs and code, or paste a link and ask “is this on brand?”.</EmptyState>)
        : [...byProvider.entries()].map(([provider, list]) => <section aria-label={providerName(provider === "other" ? null : provider)} className="-mt-px" key={provider}>
          <GroupBand count={list.length} icon={<ProviderIcon provider={provider} size={14} />}>{providerName(provider === "other" ? null : provider)}</GroupBand>
          <ul>{list.map((g) => {
            const person = g.classification === "needs_review";
            const named = resourceLabel(g.provider, g.resource); const where = named !== g.resource ? named : `${providerName(g.provider)} · ${g.resource}`;
            return <li className={rowClass} key={g.key}>
              <span className="mt-0.5">{person ? <StatusIcon kind="person" /> : <SeverityIcon severity={g.severity} />}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="min-w-0 text-sm"><span className="font-medium">{ruleName(g.rule)}</span> <span className="text-muted">{where}</span></h3>
                  <span className="flex flex-wrap items-center gap-1.5">{person && <Badge tone="warning">Needs a person</Badge>}<Badge tone={severityTone(g.severity)}>{severityName(g.severity)}</Badge></span>
                </div>
                {person ? <p className="mt-1 text-sm">{g.detected} <span className="text-muted">Expected: {g.expected}</span></p>
                  : <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><span className="text-muted">{g.count === 1 ? "1 place uses" : `${g.count} places use`}</span>{g.detected && <ValuePill tone="old" value={g.detected} />}<ChangeArrow /><span className="sr-only">It should be</span>{g.expected && <ValuePill tone="new" value={g.expected} />}</p>}
                {g.confidence < 1 && <p className="mt-1 text-xs text-muted">Confidence {Math.round(g.confidence * 100)}%. A person should check this.</p>}
                {person && <p className="mt-1 text-xs text-muted">{g.recommended}</p>}
                {g.places.length > 0 && <details className="text-sm"><summary className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control text-xs font-medium text-muted hover:text-ink lg:min-h-7"><ChevronRight className="chev" size={12} />Show {g.places.length === 1 ? "where" : `the ${g.places.length} places`}</summary><ul className="mb-1 ml-1.5 grid gap-0.5 border-l border-border pl-3 font-mono text-xs text-muted">{g.places.map((p) => <li key={p}>{p}</li>)}</ul></details>}
              </div>
            </li>; })}</ul>
        </section>)}
    </section>

    {decided.length > 0 && <section className="mt-6 border-t border-border"><details><summary className={`${pad} flex min-h-10 cursor-pointer items-center gap-2 bg-subtle text-sm font-medium hover:bg-hover`}><ChevronRight className="chev text-muted" size={14} />Earlier decisions<span className="tabular-nums text-muted">{decided.length}</span></summary><ul className="border-t border-border">{decided.map((a) => { const v = describeApproval(a.approved_action, a.resource_name, a.resource_ref); return <li className={`${rowClass} flex-wrap items-center justify-between`} key={a.id}><p className="flex min-w-0 items-center gap-3 text-sm"><StatusIcon kind={a.decision === "approved" ? "done" : a.decision === "rejected" ? "failed" : "todo"} /><span className="min-w-0">{v.heading}</span></p><p className="flex items-center gap-2 text-xs text-muted"><Badge tone={a.decision === "approved" ? "success" : a.decision === "rejected" ? "danger" : "neutral"}>{decisionName(a.decision)}</Badge><span>{via(a.decision_channel)}{via(a.decision_channel) ? " · " : ""}{whenText(a.created_at)}</span></p></li>; })}</ul></details></section>}
  </main>;
}
