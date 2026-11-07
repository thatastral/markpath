import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";

type Row = { id: string; kind: string; target: string; verdict: string; summary: string; details: string; created_at: string };
type Item = { nodeName?: string; location?: string; file?: string; property?: string; rule?: string; detected?: string; expected?: string };
const lines = (details: string) => { try { const d = JSON.parse(details) as { findings?: Item[] }; return (d.findings ?? []).slice(0, 8).map((f) => `${f.nodeName ?? f.location ?? f.file ?? "item"}: ${f.property ?? f.rule ?? "issue"} ${f.detected ?? ""}${f.expected ? ` → ${f.expected}` : ""}`.trim()); } catch { return []; } };
const label: Record<string, string> = { clean: "Clean", needs_changes: "Needs changes", needs_review: "Needs a person" };

export default async function ReviewsPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const rows = db.prepare("SELECT id, kind, target, verdict, summary, details, created_at FROM vet_reports WHERE brand_id = ? ORDER BY created_at DESC LIMIT 60").all(brand.id) as Row[];
  return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-sm font-semibold text-brand">Reviews</p><h1 className="mt-2 text-3xl font-semibold">Everything Markpath has checked</h1><p className="mt-2 max-w-3xl text-muted">Read-only checks: links reviewed in the chat room, pull requests checked automatically, and repository audits. A review never edits anything and never creates an approval.</p>
    {rows.length === 0 ? <p className="mt-8 text-muted">No reviews yet. Ask the Brand Director to vet a link in the chat room, turn on pull request checks under Integrations, or run a repository audit.</p> : <ul className="mt-6 grid gap-3">{rows.map((r) => <li className="rounded-lg border border-border bg-surface p-4" key={r.id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium capitalize">{r.kind} · <span className="font-normal normal-case text-muted">{r.target}</span></p><span className="rounded-full border border-border px-2 py-1 text-xs font-medium">{label[r.verdict] ?? r.verdict}</span></div><p className="mt-2 text-sm">{r.summary}</p>{lines(r.details).length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-muted">{lines(r.details).map((l, i) => <li key={i}>{l}</li>)}</ul>}<p className="mt-1 text-xs text-muted">{new Date(r.created_at).toLocaleString()}</p></li>)}</ul>}</main>;
}
