import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getApprovals, getFindings, type ApprovalRow } from "@/server/dashboard/service";
import { describeApproval, groupFindings, providerName, resourceLabel, ruleName, severityName, whenText } from "@/lib/labels";
import { decideTask } from "../approve/[taskId]/actions";
import { decideDashboardApproval } from "./actions";

type PageProps = { searchParams: Promise<{ provider?: string; severity?: string; view?: string }> };
const chip = "rounded-full border border-border px-3 py-1 text-sm";
const primary = "rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white";
const secondary = "rounded-[var(--radius-control)] border border-border px-4 py-2 text-sm font-medium";
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

  return <main className="mx-auto max-w-4xl px-6 py-10">
    <p className="text-sm font-semibold text-brand">Issues and approvals</p>
    <h1 className="mt-2 text-3xl font-semibold">What needs your attention</h1>
    <p className="mt-2 max-w-2xl text-muted">Open issues across your connected tools, and the changes waiting for your decision. Nothing is changed until you approve it here or by replying in the chat room.</p>

    {pending.length > 0 && <section aria-labelledby="waiting" className="mt-8">
      <h2 className="text-xl font-semibold" id="waiting">Waiting for your approval ({pending.length})</h2>
      <div className="mt-4 grid gap-4">{[...pendingByTask.entries()].map(([taskId, items]) => <div className="grid gap-3 rounded-lg border-2 border-brand bg-surface p-5" key={taskId}>
        {items.map((a) => { const v = describeApproval(a.approved_action, a.resource_name, a.resource_ref); return <article className="grid gap-2" key={a.id}>
          <h3 className="text-lg font-semibold">{v.heading}</h3><p>{v.summary}</p><p className="text-sm text-muted">{v.whatHappens}</p>
          {items.length === 1 && <div className="mt-2 flex flex-wrap gap-2"><form action={decideDashboardApproval.bind(null, a.id, "approved")}><button className={primary} type="submit">Approve these changes</button></form><form action={decideDashboardApproval.bind(null, a.id, "rejected")}><button className={secondary} type="submit">Reject</button></form></div>}
        </article>; })}
        {items.length > 1 && <form action={decideTask} className="mt-1 flex flex-wrap gap-2 border-t border-border pt-4"><input name="taskId" type="hidden" value={taskId} /><button className={primary} name="decision" type="submit" value="approved">Approve all {items.length} changes</button><button className={secondary} name="decision" type="submit" value="rejected">Reject all</button></form>}
        <p className="text-sm text-muted">You can also reply “approve” to the Brand Director in the chat room.</p>
      </div>)}</div>
    </section>}

    <section aria-labelledby="open" className="mt-10">
      <h2 className="text-xl font-semibold" id="open">Open issues</h2>
      <nav aria-label="Filter issues" className="mt-3 flex flex-wrap gap-2">{links.map(([label, href, on]) => <Link aria-current={on ? "page" : undefined} className={`${chip} ${on ? "border-brand bg-brand text-white" : ""}`} href={href} key={label}>{label}</Link>)}</nav>
      <div className="mt-4 grid gap-3">{groups.length === 0 ? <p className="rounded-lg border border-border bg-surface p-5 text-muted">{filtered ? "No open issues match this filter." : "No open issues. Ask the Brand Director in your chat room to check your designs and code, or paste a link and ask “is this on brand?”."}</p> : groups.map((g) => {
        const person = g.classification === "needs_review";
        const named = resourceLabel(g.provider, g.resource); const where = named !== g.resource ? named : `${providerName(g.provider)} · ${g.resource}`;
        return <article className="rounded-lg border border-border bg-surface p-5" key={g.key}>
          <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{ruleName(g.rule)} <span className="font-normal text-muted">· {where}</span></h3><span className="text-sm text-muted">{person ? "Needs a person · " : ""}{severityName(g.severity)}</span></div>
          <p className="mt-2">{person ? <>{g.detected} <span className="text-muted">Expected: {g.expected}</span></> : <>{g.count === 1 ? "1 place uses" : `${g.count} places use`} <strong>{g.detected}</strong>. It should be <strong>{g.expected}</strong>.</>}</p>
          {g.confidence < 1 && <p className="mt-1 text-sm text-muted">Confidence {Math.round(g.confidence * 100)}%. A person should check this.</p>}
          {person && <p className="mt-1 text-sm text-muted">{g.recommended}</p>}
          {g.places.length > 0 && <details className="mt-2 text-sm"><summary className="cursor-pointer text-muted">Show {g.places.length === 1 ? "where" : `the ${g.places.length} places`}</summary><ul className="mt-2 list-disc pl-5">{g.places.map((p) => <li key={p}>{p}</li>)}</ul></details>}
        </article>; })}</div>
    </section>

    {decided.length > 0 && <section className="mt-10"><details><summary className="cursor-pointer text-lg font-semibold">Earlier decisions ({decided.length})</summary><ul className="mt-3 grid gap-2">{decided.map((a) => { const v = describeApproval(a.approved_action, a.resource_name, a.resource_ref); return <li className="rounded-lg border border-border bg-surface p-4 text-sm" key={a.id}><p className="font-medium">{v.heading}</p><p className="text-muted">{decisionName(a.decision)} {via(a.decision_channel)} · {whenText(a.created_at)}</p></li>; })}</ul></details></section>}
  </main>;
}
