import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { approveSpec, ingestFixtureGuideline } from "../src/server/brand/service";
import { connectGithub, selectGithubRepo, setWatchPulls, watchesPulls } from "../src/server/integrations/github";
import { checkNewPullRequests, parsePullUrl, pullCommentBody, reviewPull } from "../src/server/integrations/vet";
import { AgentApiError, vetLink, vetReport } from "../src/server/agents/operations";

const patch = (lines: string[]) => ["@@ -1,2 +1,3 @@", " :root {", ...lines.map((l) => `+${l}`), " }"].join("\n");
function fakeGithub() {
  const state = { comments: [] as Array<{ number: number; body: string }>, headSha: { 1: "aaa1", 2: "bbb1", 3: "ccc1" } as Record<number, string> };
  const pulls: Record<number, { title: string; ref: string; patch: string }> = {
    1: { title: "Add pricing card", ref: "feature/pricing", patch: patch(["  --color-accent: #164B9B;", "  --radius-card: 4px;"]) },
    2: { title: "Fix typo", ref: "fix/typo", patch: patch(["  --note: 'ok';"]) },
    3: { title: "Apply Nexa values", ref: "markpath/abc12345", patch: patch(["  --color-primary: #164B9B;"]) },
  };
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.toString()); const method = init?.method ?? "GET"; const path = url.pathname;
    if (path === "/user") return json({ login: "jo" });
    if (path === "/repos/jo/site" && method === "GET") return json({ full_name: "jo/site", default_branch: "main", permissions: { push: true } });
    if (path === "/repos/jo/site/pulls" && method === "GET") return json(Object.entries(pulls).map(([n, p]) => ({ number: Number(n), title: p.title, user: { login: "dev" }, head: { ref: p.ref, sha: state.headSha[Number(n)] }, base: { ref: "main" } })));
    const one = /^\/repos\/jo\/site\/pulls\/(\d+)$/.exec(path); if (one) { const n = Number(one[1]); return json({ state: "open", merged: false, title: pulls[n].title, user: { login: "dev" }, head: { ref: pulls[n].ref, sha: state.headSha[n] }, base: { ref: "main" } }); }
    const files = /^\/repos\/jo\/site\/pulls\/(\d+)\/files$/.exec(path); if (files) return json([{ filename: "src/tokens.css", patch: pulls[Number(files[1])].patch }]);
    const comment = /^\/repos\/jo\/site\/issues\/(\d+)\/comments$/.exec(path); if (comment && method === "POST") { state.comments.push({ number: Number(comment[1]), body: JSON.parse(String(init?.body)).body }); return json({ id: state.comments.length }, 201); }
    return json({ message: `unhandled ${method} ${path}` }, 404);
  }) as typeof fetch;
  return { state, fetchImpl };
}

const saved = process.env.MARKPATH_DB_PATH; const dirs: string[] = [];
afterEach(() => { if (saved) process.env.MARKPATH_DB_PATH = saved; else delete process.env.MARKPATH_DB_PATH; dirs.splice(0).forEach((d) => { closeDatabase(join(d, "db.sqlite")); rmSync(d, { recursive: true, force: true }); }); });
async function stage() {
  const dir = mkdtempSync(join(tmpdir(), "markpath-vet-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
  const { user, brand } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
  const version = await ingestFixtureGuideline(brand.id, user.id); approveSpec(brand.id, user.id, version.id);
  const gh = fakeGithub(); await connectGithub(brand.id, "gho_x", gh.fetchImpl); await selectGithubRepo(brand.id, "jo/site", gh.fetchImpl);
  return { brand, db, gh };
}

describe("vetting links and pull requests", () => {
  it("parses pull request links", () => { expect(parsePullUrl("https://github.com/jo/site/pull/12/files")).toEqual({ repo: "jo/site", number: 12 }); expect(parsePullUrl("https://example.com")).toBeNull(); });

  it("reviews only the lines a pull request adds and says exactly what to fix", async () => {
    const { brand, gh } = await stage();
    const bad = await reviewPull(brand.id, "jo/site", 1, gh.fetchImpl);
    expect(bad.findings.map((f) => f.property).sort()).toEqual(["colour", "radius"]);
    expect((await reviewPull(brand.id, "jo/site", 2, gh.fetchImpl)).findings).toEqual([]);
    expect(pullCommentBody(bad)).toContain("#164B9B"); expect(pullCommentBody(bad)).toContain("has not changed anything");
  });

  it("the watcher comments once per commit, skips Markpath's own branches, and stays quiet on clean pull requests", async () => {
    const { brand, db, gh } = await stage();
    expect(watchesPulls(brand.id)).toBe(false); setWatchPulls(brand.id, true); expect(watchesPulls(brand.id)).toBe(true);
    expect(await checkNewPullRequests(brand.id, gh.fetchImpl)).toEqual({ checked: 2, commented: 1 }); // #1 flagged, #2 clean, #3 is Markpath's own
    expect(gh.state.comments).toHaveLength(1); expect(gh.state.comments[0].number).toBe(1);
    expect(await checkNewPullRequests(brand.id, gh.fetchImpl)).toEqual({ checked: 0, commented: 0 }); // nothing new
    gh.state.headSha[1] = "aaa2"; // the author pushes again
    expect(await checkNewPullRequests(brand.id, gh.fetchImpl)).toEqual({ checked: 1, commented: 1 });
    expect((db.prepare("SELECT COUNT(*) AS n FROM vet_reports").get() as { n: number }).n).toBe(3);
  });

  it("vets a link: reviews pull requests itself and hands design links to the Design agent, read-only", async () => {
    const { brand, db } = await stage(); const dir = { role: "director" as const, brandId: brand.id };
    expect(await vetLink(dir, { url: "https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt/x" })).toMatchObject({ kind: "figma", fileKey: "kdLxaaGP6dR3ftXJpDCKjt" });
    expect(await vetLink(dir, { url: "https://www.canva.com/design/DAHaL7l9y7c/abc/edit" })).toMatchObject({ kind: "canva", designId: "DAHaL7l9y7c" });
    await expect(vetLink(dir, { url: "https://example.com/x" })).rejects.toBeInstanceOf(AgentApiError);
    await expect(vetLink({ role: "design", brandId: brand.id }, { url: "https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt/x" })).rejects.toThrow("not allowed");
    expect(vetReport({ role: "design", brandId: brand.id }, { kind: "figma", target: "https://www.figma.com/design/k", counts: { colour: 6, typeface: 5, radius: 5 } }).verdict).toBe("needs_changes");
    expect(vetReport({ role: "design", brandId: brand.id }, { kind: "canva", target: "canva", counts: { colour: 0, humanReview: 1 } }).verdict).toBe("needs_review");
    expect(vetReport({ role: "design", brandId: brand.id }, { kind: "canva", target: "canva", counts: { colour: 0 } }).verdict).toBe("clean");
    expect(() => vetReport({ role: "qa", brandId: brand.id }, { kind: "canva", target: "c", counts: { colour: 0 } })).toThrow("not allowed");
    expect((db.prepare("SELECT COUNT(*) AS n FROM tasks").get() as { n: number }).n).toBe(0); // a review never creates a task
    expect((db.prepare("SELECT COUNT(*) AS n FROM approvals").get() as { n: number }).n).toBe(0); // or an approval
  }, 30_000);
});

import { runRepoAudit, runScheduledAuditIfDue } from "../src/server/integrations/vet";
import { setScheduleAudits } from "../src/server/integrations/github";
describe("repository audits", () => {
  it("records a read-only audit and runs the schedule only when it is on and due", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-audit-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
    const { user, brand } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
    const version = await ingestFixtureGuideline(brand.id, user.id); approveSpec(brand.id, user.id, version.id);
    const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json" } });
    const css = ":root {\n  --color-primary: #164B9B;\n}\n";
    const fetchImpl = (async (input: string | URL | Request) => { const p = new URL(typeof input === "string" ? input : input.toString()).pathname;
      if (p === "/user") return json({ login: "jo" }); if (p === "/repos/jo/site") return json({ full_name: "jo/site", default_branch: "main", permissions: { push: true } });
      if (p.endsWith("/git/trees/main")) return json({ truncated: false, tree: [{ path: "a.css", type: "blob", size: 10 }] });
      if (p.includes("/contents/")) return json({ content: Buffer.from(css).toString("base64"), sha: "s" }); return json({}); }) as typeof fetch;
    await connectGithub(brand.id, "gho_x", fetchImpl); await selectGithubRepo(brand.id, "jo/site", fetchImpl);
    expect(await runScheduledAuditIfDue(brand.id, fetchImpl)).toBe(false); // off by default
    setScheduleAudits(brand.id, true);
    expect(await runScheduledAuditIfDue(brand.id, fetchImpl)).toBe(true);
    expect(await runScheduledAuditIfDue(brand.id, fetchImpl)).toBe(false); // not due again yet
    expect(await runScheduledAuditIfDue(brand.id, fetchImpl, Date.now() + 25 * 3_600_000)).toBe(true); // due after a day
    expect(await runRepoAudit(brand.id, fetchImpl)).toMatchObject({ findings: 1, files: 1 });
    expect((db.prepare("SELECT COUNT(*) AS n FROM vet_reports WHERE kind = 'repository audit'").get() as { n: number }).n).toBe(3);
    expect((db.prepare("SELECT COUNT(*) AS n FROM tasks").get() as { n: number }).n).toBe(0);
  }, 30_000);
});

import { checkContrast, contrastRatio, isLargeText } from "../src/server/audits/contrast";
import { brandJudgementRules, extractFixtureBrandSpec } from "../src/server/brand/spec";
import { contrastCheck } from "../src/server/agents/operations";
import { readFileSync } from "node:fs";
describe("wider rules", () => {
  it("computes WCAG contrast correctly", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
    expect(isLargeText(24)).toBe(true); expect(isLargeText(19, true)).toBe(true); expect(isLargeText(19, false)).toBe(false); expect(isLargeText(undefined)).toBe(false);
    const r = checkContrast([{ label: "ok", foreground: "#101828", background: "#FFFFFF" }, { label: "light grey", foreground: "#98A2B3", background: "#FFFFFF", fontSize: 16 }, { label: "big grey", foreground: "#98A2B3", background: "#FFFFFF", fontSize: 40 }, { label: "bad", foreground: "nope", background: "#FFFFFF" }], { normal: 4.5, large: 3 });
    expect(r.failing).toBe(2); expect(r.unmeasurable).toBe(1); // #98A2B3 on white is about 2.6:1: it fails 4.5:1 and also the 3:1 large-text bar
    expect(r.results.map((x) => x.label).sort()).toEqual(["bad", "big grey", "light grey"]);
    expect(checkContrast([{ label: "big dark grey", foreground: "#767676", background: "#FFFFFF", fontSize: 40 }], { normal: 4.5, large: 3 }).failing).toBe(0);
  });
  it("reads voice and contrast rules from the guideline, with WCAG defaults when absent", () => {
    const spec = extractFixtureBrandSpec(readFileSync("fixtures/nexa-brand-guidelines.md", "utf8"));
    expect(spec.rules.find((r) => r.id === "brand-voice")?.expected).toContain("no exclamation marks");
    expect(brandJudgementRules(JSON.stringify(spec)).contrast).toEqual({ normal: 4.5, large: 3 });
    expect(brandJudgementRules("{}")).toEqual({ voice: null, contrast: { normal: 4.5, large: 3 } });
  });
  it("lets only Design, QA and the Director run the contrast check", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-contrast-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
    const { brand } = await seedDatabase(process.env.MARKPATH_DB_PATH);
    expect(contrastCheck({ role: "design", brandId: brand.id }, { pairs: [{ label: "x", foreground: "#98A2B3", background: "#FFFFFF", fontSize: 14 }] }).failing).toBe(1);
    expect(() => contrastCheck({ role: "implementation", brandId: brand.id }, { pairs: [] })).toThrow("not allowed");
  });
});

import { getFindings } from "../src/server/dashboard/service";
describe("issues on the dashboard", () => {
  it("itemises design review findings on the Issues page and replaces them on the next check", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-issues-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
    const { brand } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
    const design = { role: "design" as const, brandId: brand.id };
    vetReport(design, { kind: "figma", target: "https://www.figma.com/design/k", fileName: "Nexa design", counts: { colour: 2, contrast: 1 }, findings: [{ nodeName: "Orb", property: "colour", detected: "#164B9B", expected: "#2457F5" }, { nodeName: "Logo", property: "colour", detected: "#164B9B", expected: "#2457F5" }, { nodeName: "Card copy", property: "contrast", detected: "2.6:1 (#98A2B3 on #FFFFFF)", expected: "at least 4.5:1" }] });
    let issues = getFindings(db, brand.id);
    expect(issues).toHaveLength(3); expect(issues.map((i) => i.classification).sort()).toEqual(["confirmed", "confirmed", "needs_review"]);
    expect(issues.find((i) => i.rule_id === "text-contrast")?.recommended_action).toContain("person");
    vetReport(design, { kind: "figma", target: "https://www.figma.com/design/k", fileName: "Nexa design", counts: { colour: 1 }, findings: [{ nodeName: "Orb", property: "colour", detected: "#164B9B", expected: "#2457F5" }] });
    issues = getFindings(db, brand.id); expect(issues).toHaveLength(1); // replaced, not piled up
  });
});
