import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { resourceLabel, reviewKindName, ruleName, whenText, withCanvaLabels } from "@/lib/labels";
import { Badge, cardClass, EmptyState, PageHeader, type Tone } from "@/components/ui/primitives";
import { CheckIcon, ProviderIcon, SearchIcon } from "@/components/ui/icons";

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
  return <main className="anim-rise mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader description="Links you asked it to review, pull requests it checked, and repository audits. A review only looks: it never changes anything and never asks for approval." eyebrow="Reviews" title="What Markpath has checked">
      {rows.length > 0 && <p className="mt-3 flex flex-wrap gap-2">{Object.entries(counts).map(([v, n]) => <Badge key={v} tone={tone[v] ?? "neutral"}><span className="tabular-nums">{n}</span> {(label[v] ?? v.replaceAll("_", " ")).toLowerCase()}</Badge>)}</p>}
    </PageHeader>
    {rows.length === 0 ? <div className="mt-8"><EmptyState icon={<SearchIcon size={20} />} title="No reviews yet">Ask the Brand Director to vet a link in the chat room, turn on pull request checks under Integrations, or run a repository audit.</EmptyState></div>
      : <ul className="mt-8 grid gap-3">{rows.map((r) => { const items = lines(r.details); const v = tone[r.verdict] ?? "neutral"; return <li className={`${cardClass} relative overflow-hidden p-4 pl-5 sm:p-5 sm:pl-6`} key={r.id}>
        <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${v === "success" ? "bg-success" : v === "danger" ? "bg-danger" : v === "warning" ? "bg-warning" : "bg-border-strong"}`} />
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <p className="flex min-w-0 items-start gap-2 font-medium"><span aria-hidden className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-subtle"><ProviderIcon provider={providerOf(r.kind, r.target)} size={14} /></span><span className="min-w-0">{reviewKindName(r.kind)} <span className="font-normal text-muted">· {short(r.kind, r.target)}</span></span></p>
          <Badge tone={v}>{v === "success" && <CheckIcon className="-ml-0.5" size={12} />}{label[r.verdict] ?? r.verdict.replaceAll("_", " ")}</Badge>
        </div>
        <p className="mt-2 text-sm">{withCanvaLabels(r.summary)}</p>
        {items.length > 0 && <ul className="mt-3 grid gap-1 border-l border-border pl-3 text-sm text-muted">{items.map((l, i) => <li key={i}>{l}</li>)}</ul>}
        <p className="mt-3 text-xs tabular-nums text-muted"><time dateTime={r.created_at}>{whenText(r.created_at)}</time></p>
      </li>; })}</ul>}
  </main>;
}
