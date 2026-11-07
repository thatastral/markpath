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
