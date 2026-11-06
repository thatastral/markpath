import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { approveSpec, ingestFixtureGuideline } from "../src/server/brand/service";
import { decideApprovalForOwner } from "../src/server/dashboard/service";
import { addTaskResource, createTask, requestApproval, transitionTask } from "../src/server/tasks/service";
import { connectGithub, executeGithubReal, getGithubConfig, scanGithubRepo, selectGithubRepo, verifyGithubReal, realGithubResourceId } from "../src/server/integrations/github";
import { findBrandChanges, replaceBrandValues } from "../src/server/audits/brand-replace";
import { brandValuesFromSpec } from "../src/server/brand/spec";

const TOKENS = ":root {\n  --color-primary: #164B9B;\n  --font-primary: Inter, Arial, sans-serif;\n  --radius-button: 4px;\n}\n";
const OTHER = ".card { padding: 14px; margin: 24px; font-family: 'Interface Display'; }\n";

/** An in-memory stand-in for the GitHub API, recording every write so tests can assert what Markpath touched. */
function fakeGithub() {
  const state = { files: { "src/tokens.css": TOKENS, "src/card.css": OTHER } as Record<string, string>, refs: { main: "sha-main-1" } as Record<string, string>, branches: {} as Record<string, Record<string, string>>, writes: [] as string[], prs: [] as Array<{ head: string; base: string; files: string[] }> };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString()); const method = init?.method ?? "GET"; const path = decodeURIComponent(url.pathname); const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (method === "GET" && path === "/user") return json({ login: "jo" });
    if (method === "GET" && path === "/repos/jo/site") return json({ full_name: "jo/site", default_branch: "main", permissions: { push: true } });
    if (method === "GET" && path === "/repos/jo/site/git/trees/main") return json({ truncated: false, tree: Object.keys(state.files).map((p) => ({ path: p, type: "blob", size: 100 })) });
    const content = /^\/repos\/jo\/site\/contents\/(.+)$/.exec(path);
    if (content && method === "GET") { const ref = url.searchParams.get("ref") ?? "main"; const text = (ref === "main" ? state.files : state.branches[ref])[content[1]]; return text === undefined ? json({}, 404) : json({ content: Buffer.from(text).toString("base64"), sha: `blob-${content[1]}` }); }
    if (content && method === "PUT") { state.writes.push(`${method} ${body.branch}`); if (body.branch === "main") state.files[content[1]] = Buffer.from(body.content, "base64").toString(); else state.branches[body.branch][content[1]] = Buffer.from(body.content, "base64").toString(); return json({ commit: { sha: `commit-${state.writes.length}` } }); }
    if (method === "GET" && path === "/repos/jo/site/git/ref/heads/main") return json({ object: { sha: state.refs.main } });
    if (method === "POST" && path === "/repos/jo/site/git/refs") { const name = String(body.ref).replace("refs/heads/", ""); state.branches[name] = { ...state.files }; state.writes.push(`POST ref ${name}`); return json({}, 201); }
    if (method === "POST" && path === "/repos/jo/site/pulls") { const changed = Object.keys(state.branches[body.head]).filter((p) => state.branches[body.head][p] !== state.files[p]); state.prs.push({ head: body.head, base: body.base, files: changed }); return json({ number: 7, html_url: "https://github.com/jo/site/pull/7" }, 201); }
    if (method === "GET" && path === "/repos/jo/site/pulls/7") return json({ state: "open", merged: false, head: { ref: state.prs[0].head }, base: { ref: "main" } });
    if (method === "GET" && path === "/repos/jo/site/pulls/7/files") { const pr = state.prs[0]; return json(pr.files.map((f) => ({ filename: f, patch: state.branches[pr.head][f].split("\n").map((l) => `+${l}`).join("\n") }))); }
    return json({ message: `unhandled ${method} ${path}` }, 404);
  }) as typeof fetch;
  return { state, fetchImpl };
}

const saved = { db: process.env.MARKPATH_DB_PATH }; const dirs: string[] = [];
afterEach(() => { if (saved.db) process.env.MARKPATH_DB_PATH = saved.db; else delete process.env.MARKPATH_DB_PATH; dirs.splice(0).forEach((d) => { closeDatabase(join(d, "db.sqlite")); rmSync(d, { recursive: true, force: true }); }); });

describe("brand value detection and replacement", () => {
  const legacy = { primaryColour: "#164B9B", primaryTypeface: "Inter", buttonRadius: "4px" }; const expected = { primaryColour: "#2457F5", primaryTypeface: "Geist", buttonRadius: "8px" };
  it("changes only brand declarations and leaves lookalikes alone", () => {
    expect(findBrandChanges(OTHER, legacy, expected)).toEqual([]);
    expect(replaceBrandValues(OTHER, legacy, expected)).toBe(OTHER);
    const next = replaceBrandValues(TOKENS, legacy, expected);
    expect(next).toContain("#2457F5"); expect(next).toContain("--font-primary: Geist, Arial"); expect(next).toContain("--radius-button: 8px");
    expect(findBrandChanges(next, legacy, expected)).toEqual([]); // detection and replacement agree
  });
  it("reads previous values from the guideline's supersede line", async () => {
    const { readFile } = await import("node:fs/promises"); const { extractFixtureBrandSpec } = await import("../src/server/brand/spec");
    const values = brandValuesFromSpec(JSON.stringify(extractFixtureBrandSpec(await readFile("fixtures/nexa-brand-guidelines.md", "utf8"))))!;
    expect(values.legacy).toEqual(legacy); expect(values.expected).toEqual(expected);
  });
});

describe("real GitHub pull request flow (mocked API)", () => {
  it("scans, opens a PR on a branch after approval, never writes to the default branch, and verifies independently", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-gh-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
    const { user, brand } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
    const version = await ingestFixtureGuideline(brand.id, user.id); approveSpec(brand.id, user.id, version.id);
    const gh = fakeGithub();
    await connectGithub(brand.id, "gho_testtoken", gh.fetchImpl);
    expect(JSON.stringify(db.prepare("SELECT * FROM integration_secrets").all())).not.toContain("gho_testtoken"); // encrypted at rest
    expect(getGithubConfig(brand.id)?.token).toBe("gho_testtoken");
    expect(db.prepare("SELECT connection_status, mode FROM integrations WHERE brand_id = ? AND provider = 'github'").get(brand.id)).toEqual({ connection_status: "connected", mode: "fixture" });
    const selected = await selectGithubRepo(brand.id, "jo/site", gh.fetchImpl);
    expect(db.prepare("SELECT mode FROM integrations WHERE brand_id = ? AND provider = 'github'").get(brand.id)).toEqual({ mode: "real" });
    expect(realGithubResourceId(brand.id)).toBe(selected.resourceId);
    const scan = await scanGithubRepo(brand.id, gh.fetchImpl);
    expect(scan.files).toEqual(["src/tokens.css"]); expect(scan.findings.map((f) => f.ruleId).sort()).toEqual(["button-radius", "primary-colour", "primary-typeface"]);

    const task = createTask({ brandId: brand.id, initiatedBy: user.id, type: "brand_correction", description: "t", idempotencyKey: "gh-1" }).task;
    addTaskResource(task.id, selected.resourceId); for (const s of ["ASSESSING", "AUDITING", "PLAN_READY"] as const) transitionTask(task.id, s, "Brand Director");
    const operation = { resourceId: selected.resourceId, operation: "replace_tokens", payload: { values: "nexa-2.0" } };
    const approvalId = requestApproval(task.id, user.id, operation); transitionTask(task.id, "AWAITING_APPROVAL", "Brand Director");
    await expect(executeGithubReal({ brandId: brand.id, taskId: task.id, resourceId: selected.resourceId, operation }, gh.fetchImpl)).rejects.toThrow("approved"); // refused before approval
    expect(gh.state.writes).toEqual([]);
    decideApprovalForOwner(db, { approvalId, userId: user.id, decision: "approved" });
    const evidence = await executeGithubReal({ brandId: brand.id, taskId: task.id, resourceId: selected.resourceId, operation }, gh.fetchImpl);
    expect(evidence.label).toBe("real GitHub pull request"); expect(evidence.changedFiles).toEqual(["src/tokens.css"]); expect(evidence.pullRequest.url).toContain("/pull/7");
    expect(gh.state.writes.every((w) => !w.endsWith(" main"))).toBe(true); // nothing was written to the default branch
    expect(gh.state.files["src/tokens.css"]).toBe(TOKENS); expect(gh.state.prs[0]).toMatchObject({ base: "main", files: ["src/tokens.css"] });
    await expect(executeGithubReal({ brandId: brand.id, taskId: task.id, resourceId: selected.resourceId, operation }, gh.fetchImpl)).rejects.toThrow("approved"); // single use
    const report = await verifyGithubReal({ brandId: brand.id, taskId: task.id, resourceId: selected.resourceId, evidence }, gh.fetchImpl);
    expect(report).toMatchObject({ verified: true, defaultBranchUnchanged: true, onlyIntendedFilesChanged: true, noLegacyValuesAdded: true, pullRequestOpenNotMerged: true });
    gh.state.refs.main = "sha-main-2"; // someone (or something) moved the default branch after the PR
    expect((await verifyGithubReal({ brandId: brand.id, taskId: task.id, resourceId: selected.resourceId, evidence }, gh.fetchImpl)).verified).toBe(false);
  }, 30_000);
});
