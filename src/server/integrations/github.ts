import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { brandValuesFromSpec } from "@/server/brand/spec";
import { findBrandChanges, replaceBrandValues } from "@/server/audits/brand-replace";
import type { AuditFinding } from "@/server/audits/types";
import { consumeApproval, isApprovedOperation, type ProposedOperation } from "@/server/tasks/service";
import { deleteIntegrationSecret, getIntegrationSecret, saveIntegrationSecret, updateIntegrationMeta } from "./secrets";
import { GithubClient, GithubError, type Fetch } from "./github-client";

const now = () => new Date().toISOString();
function db() { const database = getDatabase(); initializeSchema(database); return database; }
const SCAN_EXTENSIONS = /\.(css|scss|less|ts|tsx|js|jsx|mjs|html|json)$/i;
const SKIP = /(^|\/)(node_modules|dist|build|\.next|coverage|vendor)\//i;
const SKIP_FILES = /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.min\.)/i;
const ruleOf = { colour: "primary-colour", typeface: "primary-typeface", radius: "button-radius" } as const;

export type GithubConfig = { token: string; login: string; repo?: string; defaultBranch?: string };
export function getGithubConfig(brandId: string): GithubConfig | null {
  const s = getIntegrationSecret(brandId, "github"); if (!s) return null;
  return { token: s.secret, login: String(s.meta.login ?? ""), repo: s.meta.repo as string | undefined, defaultBranch: s.meta.defaultBranch as string | undefined };
}
export function setWatchPulls(brandId: string, on: boolean) { const s = getIntegrationSecret(brandId, "github"); if (s) updateIntegrationMeta(brandId, "github", { ...s.meta, watchPulls: on }); }
export const watchesPulls = (brandId: string) => Boolean(getIntegrationSecret(brandId, "github")?.meta.watchPulls);
export const isRealGithub = (brandId: string) => { const c = getGithubConfig(brandId); return Boolean(c?.repo); };

function setIntegration(brandId: string, status: string, mode: string, account: string | null) {
  db().prepare("UPDATE integrations SET connection_status = ?, mode = ?, external_account_id = ?, last_checked_at = ? WHERE brand_id = ? AND provider = 'github'").run(status, mode, account, now(), brandId);
}

/** Stores the user's GitHub token (encrypted) after confirming it works. */
export async function connectGithub(brandId: string, token: string, fetchImpl?: Fetch) {
  const me = await new GithubClient(token, fetchImpl).user();
  saveIntegrationSecret(brandId, "github", token, { login: me.login });
  setIntegration(brandId, "connected", "fixture", me.login); // connected, but no repo chosen yet: still fixture mode
  return { login: me.login };
}
export function disconnectGithub(brandId: string) { deleteIntegrationSecret(brandId, "github"); setIntegration(brandId, "not_connected", "fixture", null); }

export async function listGithubRepos(brandId: string, fetchImpl?: Fetch) {
  const c = getGithubConfig(brandId); if (!c) throw new GithubError("GitHub is not connected.", 409);
  return (await new GithubClient(c.token, fetchImpl).listRepos()).filter((r) => r.permissions?.push).map((r) => ({ fullName: r.full_name, private: r.private, defaultBranch: r.default_branch }));
}

export async function selectGithubRepo(brandId: string, fullName: string, fetchImpl?: Fetch) {
  const c = getGithubConfig(brandId); if (!c) throw new GithubError("GitHub is not connected.", 409);
  const repo = await new GithubClient(c.token, fetchImpl).repo(fullName);
  if (!repo.permissions?.push) throw new GithubError("You do not have push access to that repository, so Markpath cannot open a pull request there.", 403);
  updateIntegrationMeta(brandId, "github", { login: c.login, repo: repo.full_name, defaultBranch: repo.default_branch });
  const resourceId = ensureRepoResource(brandId, repo.full_name);
  setIntegration(brandId, "connected", "real", c.login);
  return { repo: repo.full_name, defaultBranch: repo.default_branch, resourceId };
}
function ensureRepoResource(brandId: string, fullName: string) {
  const integration = db().prepare("SELECT id FROM integrations WHERE brand_id = ? AND provider = 'github'").get(brandId) as { id: string } | undefined;
  const externalId = `gh:${fullName}`;
  let resource = db().prepare("SELECT id FROM resources WHERE brand_id = ? AND external_resource_id = ?").get(brandId, externalId) as { id: string } | undefined;
  if (!resource) { resource = { id: randomUUID() }; db().prepare(`INSERT INTO resources (id, brand_id, integration_id, resource_type, external_resource_id, resource_name, resource_url, last_inspected_at, status, created_at) VALUES (?, ?, ?, 'github_repo', ?, ?, ?, NULL, 'uninspected', ?)`).run(resource.id, brandId, integration?.id ?? null, externalId, fullName, `https://github.com/${fullName}`, now()); }
  return resource.id;
}
/** The selected repository's resource row. Recreated if a demo reset removed it, so a chosen repository is never silently dropped. */
export function realGithubResourceId(brandId: string) {
  const c = getGithubConfig(brandId); if (!c?.repo) return null;
  return ensureRepoResource(brandId, c.repo);
}
function specValues(brandId: string) {
  const row = db().prepare("SELECT brand_specification, brand_version, name FROM brands WHERE id = ?").get(brandId) as { brand_specification: string; brand_version: string; name: string } | undefined;
  const values = row ? brandValuesFromSpec(row.brand_specification) : null;
  if (!row || !values) throw new GithubError("The brand specification has no approved colour, typeface and radius rules yet.", 409);
  return { ...values, brand: row.name, version: row.brand_version };
}

async function candidateFiles(client: GithubClient, repo: string, branch: string) {
  const tree = await client.tree(repo, branch);
  return tree.tree.filter((e) => e.type === "blob" && SCAN_EXTENSIONS.test(e.path) && !SKIP.test(e.path) && !SKIP_FILES.test(e.path) && (e.size ?? 0) < 100_000).slice(0, 80);
}
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const index = i++; out[index] = await fn(items[index]); } }));
  return out;
}

export async function scanGithubRepo(brandId: string, fetchImpl?: Fetch): Promise<{ findings: AuditFinding[]; files: string[] }> {
  const c = getGithubConfig(brandId); if (!c?.repo || !c.defaultBranch) throw new GithubError("No GitHub repository is selected.", 409);
  const { expected, legacy } = specValues(brandId); const client = new GithubClient(c.token, fetchImpl);
  const files = await candidateFiles(client, c.repo, c.defaultBranch);
  const results = await mapLimit(files, 8, async (f) => { const { text } = await client.file(c.repo!, f.path, c.defaultBranch!); return { path: f.path, changes: findBrandChanges(text, legacy, expected) }; });
  const findings: AuditFinding[] = results.flatMap((r) => r.changes.map((ch) => ({ platform: "github" as const, location: `${r.path}:${ch.line}`, ruleId: ruleOf[ch.property], detected: ch.detected, expected: ch.expected, evidence: `${r.path} line ${ch.line}: ${ch.text}`, severity: (ch.property === "colour" ? "high" : "medium") as "high" | "medium", confidence: 1, classification: "confirmed" as const, recommendedAction: `Replace ${ch.detected} with ${ch.expected}.` })));
  return { findings, files: [...new Set(results.filter((r) => r.changes.length).map((r) => r.path))] };
}

export async function executeGithubReal(input: { brandId: string; taskId: string; resourceId: string; operation: ProposedOperation }, fetchImpl?: Fetch) {
  const approvalId = isApprovedOperation(input.taskId, input.operation);
  if (!approvalId) throw new Error("Refused: this exact resource operation does not have an approved approval record.");
  const c = getGithubConfig(input.brandId); if (!c?.repo || !c.defaultBranch) throw new GithubError("No GitHub repository is selected.", 409);
  const { expected, legacy, brand, version } = specValues(input.brandId); const client = new GithubClient(c.token, fetchImpl);
  const baseShaBefore = await client.branchSha(c.repo, c.defaultBranch);
  const files = await candidateFiles(client, c.repo, c.defaultBranch);
  const edits = (await mapLimit(files, 8, async (f) => { const file = await client.file(c.repo!, f.path, c.defaultBranch!); const next = replaceBrandValues(file.text, legacy, expected); return next === file.text ? null : { path: f.path, sha: file.sha, text: next }; })).filter((e): e is { path: string; sha: string; text: string } => e !== null);
  if (edits.length === 0) throw new Error("The repository already contains the approved values; no pull request was opened.");
  const branch = `markpath/${input.taskId.slice(0, 8)}`;
  await client.createBranch(c.repo, branch, baseShaBefore);
  let commit = "";
  for (const e of edits) commit = (await client.putFile(c.repo, e.path, { message: `fix: apply ${brand} ${version} brand values to ${e.path}`, text: e.text, branch, sha: e.sha })).commit.sha;
  const pr = await client.createPull(c.repo, { title: `Apply ${brand} ${version} brand values`, head: branch, base: c.defaultBranch, body: `Opened by Markpath after an approved operation (approval ${approvalId}).\n\nUpdates outdated brand values to the approved specification (${version}) in ${edits.length} file(s). Markpath never merges: please review and merge here.` });
  const evidence = { label: "real GitHub pull request", repo: c.repo, baseBranch: c.defaultBranch, baseShaBefore, branch, commit, pullRequest: { number: pr.number, url: pr.html_url }, changedFiles: edits.map((e) => e.path), approvalId };
  db().prepare(`INSERT INTO execution_records (id, task_id, resource_id, operation, result, evidence, mode, executed_at) VALUES (?, ?, ?, ?, 'succeeded', ?, 'github_real', ?)`).run(randomUUID(), input.taskId, input.resourceId, input.operation.operation, JSON.stringify(evidence), now());
  consumeApproval(approvalId);
  return evidence;
}

/** Independent re-read through the GitHub API. API success on creation is not treated as proof. */
export async function verifyGithubReal(input: { brandId: string; taskId: string; resourceId: string; evidence: { repo: string; baseBranch: string; baseShaBefore: string; pullRequest: { number: number }; changedFiles: string[] } }, fetchImpl?: Fetch) {
  const c = getGithubConfig(input.brandId); if (!c) throw new GithubError("GitHub is not connected.", 409);
  const { expected, legacy } = specValues(input.brandId); const client = new GithubClient(c.token, fetchImpl); const e = input.evidence;
  const [pull, files, baseShaNow] = await Promise.all([client.pull(e.repo, e.pullRequest.number), client.pullFiles(e.repo, e.pullRequest.number), client.branchSha(e.repo, e.baseBranch)]);
  const added = files.map((f) => (f.patch ?? "").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n"));
  const onlyIntended = files.every((f) => e.changedFiles.includes(f.filename)) && files.length === e.changedFiles.length;
  const noLegacyAdded = added.every((text) => findBrandChanges(text, legacy, expected).length === 0);
  const expectedPresent = added.some((text) => [expected.primaryColour, expected.primaryTypeface, expected.buttonRadius].some((v) => text.toLowerCase().includes(v.toLowerCase())));
  const verified = pull.state === "open" && !pull.merged && baseShaNow === e.baseShaBefore && onlyIntended && noLegacyAdded && expectedPresent;
  const report = { verified, label: "independent GitHub API re-read", pullRequestOpenNotMerged: pull.state === "open" && !pull.merged, defaultBranchUnchanged: baseShaNow === e.baseShaBefore, onlyIntendedFilesChanged: onlyIntended, changedFiles: files.map((f) => f.filename), noLegacyValuesAdded: noLegacyAdded, expectedValuesPresent: expectedPresent };
  db().prepare(`INSERT INTO execution_records (id, task_id, resource_id, operation, result, evidence, mode, executed_at) VALUES (?, ?, ?, 'verify_github_real', ?, ?, 'github_real', ?)`).run(randomUUID(), input.taskId, input.resourceId, verified ? "verified" : "failed_verification", JSON.stringify(report), now());
  return report;
}

/** Creates a private sample repository with the Nexa fixture's outdated tokens so a first run needs nothing prepared. */
export async function createDemoRepo(brandId: string, fetchImpl?: Fetch) {
  const c = getGithubConfig(brandId); if (!c) throw new GithubError("GitHub is not connected.", 409);
  const client = new GithubClient(c.token, fetchImpl); const name = `markpath-nexa-demo-${randomUUID().slice(0, 4)}`;
  const repo = await client.createRepo(name, "Sample site with outdated brand values, created by Markpath for trying the audit and pull request flow.");
  for (const path of ["src/styles/tokens.css", "src/components/button.css"]) {
    const text = await readFile(join(process.cwd(), "fixtures", "nexa-web", path), "utf8");
    for (let attempt = 0; ; attempt++) { try { await client.putFile(repo.full_name, path, { message: `chore: add ${path}`, text, branch: repo.default_branch }); break; } catch (error) { if (attempt >= 4) throw error; await new Promise((r) => setTimeout(r, 1500)); } }
  }
  return selectGithubRepo(brandId, repo.full_name, fetchImpl);
}
