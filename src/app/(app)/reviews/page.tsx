import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { resourceLabel, reviewKindName, ruleName, whenText, withCanvaLabels } from "@/lib/labels";
import { Badge, buttonClass, EmptyState, PageHeader, rowClass, StatusIcon, type StatusKind, type Tone } from "@/components/ui/primitives";
import { CheckIcon, ProviderIcon, SearchIcon } from "@/components/ui/icons";
import { pageTitle } from "../page-title";
export async function generateMetadata() { return { title: await pageTitle("Reviews") }; }

type Row = { id: string; kind: string; target: string; verdict: string; summary: string; details: string; created_at: string };
type Item = { nodeName?: string; location?: string; file?: string; property?: string; rule?: string; detected?: string; expected?: string };
const lines = (details: string) => { try { const d = JSON.parse(details) as { findings?: Item[]; items?: unknown[] }; const found = (d.findings ?? []).map((f) => `${f.nodeName ?? f.location ?? f.file ?? "Item"}: ${f.property ?? (f.rule ? ruleName(f.rule) : "issue")} ${f.detected ?? ""}${f.expected ? ` → ${f.expected}` : ""}`.trim()); return (found.length ? found : (d.items ?? []).filter((i): i is string => typeof i === "string")).slice(0, 8).map(withCanvaLabels); } catch { return []; } };
const short = (kind: string, t: string) => { const named = resourceLabel(kind, t); if (named !== t) return named; const clean = t.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, ""); return clean.length > 56 ? `${clean.slice(0, 53)}…` : clean; };
const label: Record<string, string> = { clean: "Clean", needs_changes: "Needs changes", needs_review: "Needs a person" };
const tone: Record<string, Tone> = { clean: "success", needs_changes: "danger", needs_review: "warning" };
const providerOf = (kind: string, target: string) => /figma/i.test(kind + target) ? "figma" : /canva/i.test(kind + target) ? "canva" : /github|pull|repo/i.test(kind + target) ? "github" : null;

export default async function ReviewsPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const rows = db.prepare("SELECT id, kind, target, verdict, summary, details, created_at FROM vet_reports WHERE brand_id = ? ORDER BY created_at DESC LIMIT 60").all(brand.id) as Row[];
  const counts = rows.reduce<Record<string, number>>((m, r) => ({ ...m, [r.verdict]: (m[r.verdict] ?? 0) + 1 }), {});
  const kindOf: Record<string, StatusKind> = { clean: "done", needs_changes: "failed", needs_review: "person" };
  return <main className="anim-rise">
    <PageHeader actions={rows.length > 0 ? <span className="flex flex-wrap gap-1.5">{Object.entries(counts).map(([v, n]) => <Badge key={v} tone={tone[v] ?? "neutral"}><span className="tabular-nums">{n}</span> {(label[v] ?? v.replaceAll("_", " ")).toLowerCase()}</Badge>)}</span> : undefined} description="Links, pull requests and repositories the agents checked. Reviews only look: they never change anything or ask for approval." title="Reviews" />
    {rows.length === 0 ? <EmptyState action={<><Link className={buttonClass("primary")} href="/integrations">Turn on checks</Link><Link className={buttonClass("secondary")} href="/issues">See issues</Link></>} icon={<SearchIcon size={28} />} title="No reviews yet">Ask the Brand Director to review a link in your chat room, or turn on pull request checks.</EmptyState>
      : <ul>{rows.map((r) => { const items = lines(r.details); return <li className={`${rowClass} py-2.5`} key={r.id}>
        <span className="mt-0.5"><StatusIcon kind={kindOf[r.verdict] ?? "todo"} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p className="flex min-w-0 items-start gap-2 text-sm"><ProviderIcon aria-hidden className="mt-0.5 shrink-0 text-muted" provider={providerOf(r.kind, r.target)} size={14} /><span className="min-w-0"><span className="font-medium">{reviewKindName(r.kind)}</span> <span className="text-muted" title={r.target}>{short(r.kind, r.target)}</span></span></p>
            <span className="flex items-center gap-2"><Badge tone={tone[r.verdict] ?? "neutral"}>{r.verdict === "clean" && <CheckIcon className="-ml-0.5" size={11} />}{label[r.verdict] ?? r.verdict.replaceAll("_", " ")}</Badge><time className="whitespace-nowrap text-xs tabular-nums text-muted" dateTime={r.created_at}>{whenText(r.created_at)}</time></span>
          </div>
          <p className="mt-0.5 text-sm text-muted">{withCanvaLabels(r.summary)}</p>
          {items.length > 0 && <div className="mt-2 rounded-control border border-border bg-subtle px-3 py-2 text-xs text-muted"><p className="font-medium tabular-nums text-ink">{items.length === 1 ? "1 issue found" : `${items.length} issues found`}</p><ul className="mt-1 grid gap-0.5">{items.map((l, i) => <li key={i}>{l}</li>)}</ul></div>}
        </div>
      </li>; })}</ul>}
  </main>;
}
