import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { resourceLabel, reviewKindName, ruleName, whenText, withCanvaLabels } from "@/lib/labels";

type Row = { id: string; kind: string; target: string; verdict: string; summary: string; details: string; created_at: string };
type Item = { nodeName?: string; location?: string; file?: string; property?: string; rule?: string; detected?: string; expected?: string };
const lines = (details: string) => { try { const d = JSON.parse(details) as { findings?: Item[]; items?: unknown[] }; const found = (d.findings ?? []).map((f) => `${f.nodeName ?? f.location ?? f.file ?? "Item"}: ${f.property ?? (f.rule ? ruleName(f.rule) : "issue")} ${f.detected ?? ""}${f.expected ? ` → ${f.expected}` : ""}`.trim()); return (found.length ? found : (d.items ?? []).filter((i): i is string => typeof i === "string")).slice(0, 8).map(withCanvaLabels); } catch { return []; } };
const short = (kind: string, t: string) => { const named = resourceLabel(kind, t); if (named !== t) return named; const clean = t.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, ""); return clean.length > 56 ? `${clean.slice(0, 53)}…` : clean; };
const label: Record<string, string> = { clean: "Clean", needs_changes: "Needs changes", needs_review: "Needs a person" };

export default async function ReviewsPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const rows = db.prepare("SELECT id, kind, target, verdict, summary, details, created_at FROM vet_reports WHERE brand_id = ? ORDER BY created_at DESC LIMIT 60").all(brand.id) as Row[];
  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold text-brand">Reviews</p><h1 className="mt-2 text-3xl font-semibold">What Markpath has checked</h1><p className="mt-2 max-w-3xl text-muted">Links you asked it to review, pull requests it checked, and repository audits. A review only looks: it never changes anything and never asks for approval.</p>
    {rows.length === 0 ? <p className="mt-8 text-muted">No reviews yet. Ask the Brand Director to vet a link in the chat room, turn on pull request checks under Integrations, or run a repository audit.</p> : <ul className="mt-6 grid gap-3">{rows.map((r) => <li className="rounded-lg border border-border bg-surface p-4" key={r.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{reviewKindName(r.kind)} <span className="font-normal text-muted">· {short(r.kind, r.target)}</span></p><span className="rounded-full border border-border px-2 py-1 text-xs font-medium">{label[r.verdict] ?? r.verdict.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm">{withCanvaLabels(r.summary)}</p>{lines(r.details).length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-muted">{lines(r.details).map((l, i) => <li key={i}>{l}</li>)}</ul>}<p className="mt-1 text-xs text-muted">{whenText(r.created_at)}</p></li>)}</ul>}</main>;
}
