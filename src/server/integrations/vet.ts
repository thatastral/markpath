import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { brandValuesFromSpec } from "@/server/brand/spec";
import { findBrandChanges } from "@/server/audits/brand-replace";
import { recordActivity } from "@/server/tasks/service";
import { getGithubConfig } from "./github";
import { GithubClient, GithubError, type Fetch } from "./github-client";

function db() { const database = getDatabase(); initializeSchema(database); return database; }
export const parsePullUrl = (input: string) => { const m = /github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/.exec(input.trim()); return m ? { repo: `${m[1]}/${m[2]}`, number: Number(m[3]) } : null; };
export function brandValuesFor(brandId: string) {
  const row = db().prepare("SELECT brand_specification FROM brands WHERE id = ?").get(brandId) as { brand_specification: string } | undefined;
  const values = row ? brandValuesFromSpec(row.brand_specification) : null;
  if (!values) throw new GithubError("The brand specification has no approved colour, typeface and radius rules yet.", 409);
  return values;
}

export type PullFinding = { file: string; property: string; detected: string; expected: string; line: string };
/** Reviews only the lines a pull request ADDS, so existing code is not blamed on the author. Read-only: nothing is changed on GitHub. */
export async function reviewPull(brandId: string, repo: string, number: number, fetchImpl?: Fetch) {
  const c = getGithubConfig(brandId); if (!c) throw new GithubError("GitHub is not connected, so Markpath cannot read that pull request.", 409);
  const { expected, legacy } = brandValuesFor(brandId); const client = new GithubClient(c.token, fetchImpl);
  const [pull, files] = await Promise.all([client.pull(repo, number), client.pullFiles(repo, number)]);
  const findings: PullFinding[] = [];
  for (const f of files) for (const line of (f.patch ?? "").split("\n")) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    for (const ch of findBrandChanges(line.slice(1), legacy, expected)) findings.push({ file: f.filename, property: ch.property, detected: ch.detected, expected: ch.expected, line: ch.text });
  }
  return { repo, number, title: pull.title, author: pull.user?.login ?? "unknown", headSha: pull.head.sha, headRef: pull.head.ref, state: pull.state, filesChecked: files.length, findings };
}

export function recordVet(brandId: string, input: { kind: string; target: string; verdict: "clean" | "needs_changes" | "needs_review"; summary: string; details?: unknown; agent: string }) {
  db().prepare("INSERT INTO vet_reports (id, brand_id, kind, target, verdict, summary, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(randomUUID(), brandId, input.kind, input.target.slice(0, 300), input.verdict, input.summary.slice(0, 500), JSON.stringify(input.details ?? {}), new Date().toISOString());
  recordActivity({ brandId, agentName: input.agent, activityType: "vet", status: `${input.kind} review: ${input.summary}`.slice(0, 160) });
}

export function pullReviewSummary(r: Awaited<ReturnType<typeof reviewPull>>) {
  const n = r.findings.length;
  return { verdict: (n === 0 ? "clean" : "needs_changes") as "clean" | "needs_changes", summary: n === 0 ? `PR #${r.number} "${r.title}": no outdated brand values in the ${r.filesChecked} changed file(s).` : `PR #${r.number} "${r.title}": ${n} outdated brand value(s) added in ${new Set(r.findings.map((f) => f.file)).size} file(s).` };
}

/** The review comment Markpath leaves on a pull request. Short, specific, and it changes nothing. */
export function pullCommentBody(r: Awaited<ReturnType<typeof reviewPull>>) {
  const lines = r.findings.slice(0, 15).map((f) => `- \`${f.file}\`: ${f.property} \`${f.detected}\`, should be \`${f.expected}\`\n  \`${f.line}\``);
  return `### Markpath brand check\nThis pull request adds ${r.findings.length} value(s) that don't match the approved brand specification:\n\n${lines.join("\n")}${r.findings.length > 15 ? `\n- …and ${r.findings.length - 15} more` : ""}\n\nMarkpath only reviews; it has not changed anything. Ask the Brand Director in your team chat to fix these, or update them in this branch.`;
}

/** Reviews open pull requests it has not seen at their current commit, and comments only when something is off. */
export async function checkNewPullRequests(brandId: string, fetchImpl?: Fetch) {
  const c = getGithubConfig(brandId); if (!c?.repo) return { checked: 0, commented: 0 };
  const client = new GithubClient(c.token, fetchImpl); let checked = 0, commented = 0;
  for (const pr of await client.listOpenPulls(c.repo)) {
    if (pr.head.ref.startsWith("markpath/")) continue; // Markpath's own fix branches
    if (db().prepare("SELECT 1 FROM pr_checks WHERE brand_id = ? AND repo = ? AND number = ? AND head_sha = ?").get(brandId, c.repo, pr.number, pr.head.sha)) continue;
    const review = await reviewPull(brandId, c.repo, pr.number, fetchImpl); checked++;
    let didComment = 0;
    if (review.findings.length > 0) { await client.comment(c.repo, pr.number, pullCommentBody(review)); didComment = 1; commented++; }
    db().prepare("INSERT INTO pr_checks (brand_id, repo, number, head_sha, findings, commented, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(brandId, c.repo, pr.number, pr.head.sha, review.findings.length, didComment, new Date().toISOString());
    const s = pullReviewSummary(review); recordVet(brandId, { kind: "pull request", target: `${c.repo}#${pr.number}`, verdict: s.verdict, summary: s.summary, details: { findings: review.findings.slice(0, 30), commented: Boolean(didComment) }, agent: "Markpath PR check" });
  }
  return { checked, commented };
}
