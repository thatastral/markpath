import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getApprovals, getFindings, type ApprovalRow } from "@/server/dashboard/service";
import { describeApproval, groupFindings, providerName, resourceLabel, ruleName, severityName, whenText } from "@/lib/labels";
import { AgentAvatar, Badge, buttonClass, cardClass, ChangeArrow, EmptyState, PageHeader, SectionHeading, severityTone, ValuePill } from "@/components/ui/primitives";
import { CheckIcon, ChevronRight, InboxIcon, ProviderIcon, SearchIcon } from "@/components/ui/icons";
import { ChangeList } from "@/components/ui/change-list";
import { decideTask } from "../approve/[taskId]/actions";
import { decideDashboardApproval } from "./actions";

type PageProps = { searchParams: Promise<{ provider?: string; severity?: string; view?: string }> };
const chip = "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium sm:min-h-9";
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

  return <main className="anim-rise mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader description="Open issues across your connected tools, and the changes waiting for your decision. Nothing is changed until you approve it here or by replying in the chat room." eyebrow="Issues and approvals" title="What needs your attention" />

    {pending.length > 0 && <section aria-labelledby="waiting" className="mt-8">
      <SectionHeading count={pending.length} id="waiting" title="Waiting for your approval" />
      <div className="mt-3 grid gap-4">{[...pendingByTask.entries()].map(([taskId, items]) => <div className="overflow-hidden rounded-card border border-brand/40 bg-surface shadow-card ring-4 ring-brand/5" key={taskId}>
        <div className="flex flex-wrap items-center gap-2 border-b border-brand/20 bg-brand-soft px-4 py-2.5 text-sm sm:px-5"><AgentAvatar name="Brand Director" size="sm" /><span className="font-medium">Brand Director</span><span className="text-muted">asked for approval</span><Badge className="ml-auto" tone="brand">Waiting for you</Badge></div>
        <div className="divide-y divide-border">{items.map((a) => { const v = describeApproval(a.approved_action, a.resource_name, a.resource_ref); return <article className="grid gap-2 p-4 sm:p-5" key={a.id}>
          <h3 className="text-lg font-semibold tracking-tight">{v.heading}</h3><p>{v.summary}</p>
          {v.changes.length > 0 && <ChangeList changes={v.changes} />}
          <p className="text-sm text-muted">{v.whatHappens}</p>
          {items.length === 1 && <div className="mt-2 flex flex-wrap gap-2"><form action={decideDashboardApproval.bind(null, a.id, "approved")}><button className={primary} type="submit"><CheckIcon />Approve these changes</button></form><form action={decideDashboardApproval.bind(null, a.id, "rejected")}><button className={secondary} type="submit">Reject</button></form></div>}
        </article>; })}</div>
        {items.length > 1 && <form action={decideTask} className="flex flex-wrap gap-2 border-t border-border bg-subtle/60 px-4 py-3 sm:px-5"><input name="taskId" type="hidden" value={taskId} /><button className={primary} name="decision" type="submit" value="approved"><CheckIcon />Approve all {items.length} changes</button><button className={secondary} name="decision" type="submit" value="rejected">Reject all</button></form>}
        <p className="border-t border-border px-4 py-2.5 text-sm text-muted sm:px-5">You can also reply “approve” to the Brand Director in the chat room.</p>
      </div>)}</div>
    </section>}

    <section aria-labelledby="open" className="mt-10">
      <SectionHeading count={groups.length} id="open" title="Open issues" />
      <nav aria-label="Filter issues" className="-mx-1 mt-3 flex flex-wrap gap-2 px-1">{links.map(([label, href, on]) => <Link aria-current={on ? "page" : undefined} className={`${chip} ${on ? "border-ink bg-ink text-canvas" : "border-border-strong bg-surface text-muted hover:border-muted hover:text-ink"}`} href={href} key={label}>{on && <CheckIcon size={14} />}{label}</Link>)}</nav>
      {groups.length > 0 && <p className="mt-3 text-sm text-muted"><span className="tabular-nums">{groups.length}</span> {groups.length === 1 ? "issue" : "issues"} in <span className="tabular-nums">{totalPlaces}</span> {totalPlaces === 1 ? "place" : "places"}</p>}
      <div className="mt-4 grid gap-4">{groups.length === 0 ? (filtered
        ? <EmptyState action={<Link className={buttonClass("secondary")} href="/issues">Clear filters</Link>} icon={<SearchIcon size={20} />} title="No open issues match this filter">Try another filter, or clear it to see everything.</EmptyState>
        : <EmptyState icon={<InboxIcon size={20} />} title="No open issues">Ask the Brand Director in your chat room to check your designs and code, or paste a link and ask “is this on brand?”.</EmptyState>)
        : [...byProvider.entries()].map(([provider, list]) => <section aria-label={providerName(provider === "other" ? null : provider)} className={`overflow-hidden ${cardClass}`} key={provider}>
          <div className="flex items-center gap-2 border-b border-border bg-subtle px-4 py-2.5 text-sm font-medium"><ProviderIcon provider={provider} /><span>{providerName(provider === "other" ? null : provider)}</span><span className="tabular-nums text-muted">{list.length}</span></div>
          <ul className="divide-y divide-border">{list.map((g) => {
            const person = g.classification === "needs_review";
            const named = resourceLabel(g.provider, g.resource); const where = named !== g.resource ? named : `${providerName(g.provider)} · ${g.resource}`;
            return <li className="p-4 sm:px-5" key={g.key}>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2"><h3 className="min-w-0 font-semibold">{ruleName(g.rule)} <span className="font-normal text-muted">· {where}</span></h3><span className="flex flex-wrap gap-1.5">{person && <Badge tone="warning">Needs a person</Badge>}<Badge tone={severityTone(g.severity)}>{severityName(g.severity)}</Badge></span></div>
              {person ? <p className="mt-2 text-sm">{g.detected} <span className="text-muted">Expected: {g.expected}</span></p>
                : <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm"><span className="text-muted">{g.count === 1 ? "1 place uses" : `${g.count} places use`}</span>{g.detected && <ValuePill tone="old" value={g.detected} />}<ChangeArrow /><span className="sr-only">It should be</span>{g.expected && <ValuePill tone="new" value={g.expected} />}</p>}
              {g.confidence < 1 && <p className="mt-2 text-sm text-muted">Confidence {Math.round(g.confidence * 100)}%. A person should check this.</p>}
              {person && <p className="mt-1 text-sm text-muted">{g.recommended}</p>}
              {g.places.length > 0 && <details className="mt-2 text-sm"><summary className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control font-medium text-muted hover:text-ink"><ChevronRight className="chev" />Show {g.places.length === 1 ? "where" : `the ${g.places.length} places`}</summary><ul className="mb-1 ml-5 grid gap-1 border-l border-border pl-3 font-mono text-[0.8125rem] text-muted">{g.places.map((p) => <li key={p}>{p}</li>)}</ul></details>}
            </li>; })}</ul>
        </section>)}</div>
    </section>

    {decided.length > 0 && <section className="mt-10"><details className={cardClass}><summary className="flex min-h-12 cursor-pointer items-center gap-2 rounded-card px-4 font-semibold hover:bg-subtle/60"><ChevronRight className="chev text-muted" />Earlier decisions<span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium tabular-nums text-muted">{decided.length}</span></summary><ul className="divide-y divide-border border-t border-border">{decided.map((a) => { const v = describeApproval(a.approved_action, a.resource_name, a.resource_ref); return <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm" key={a.id}><p className="min-w-0 font-medium">{v.heading}</p><p className="flex items-center gap-2 text-muted"><Badge tone={a.decision === "approved" ? "success" : a.decision === "rejected" ? "danger" : "neutral"}>{decisionName(a.decision)}</Badge><span>{via(a.decision_channel)}{via(a.decision_channel) ? " · " : ""}{whenText(a.created_at)}</span></p></li>; })}</ul></details></section>}
  </main>;
}

