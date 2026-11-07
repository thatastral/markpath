import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { approveSpec, ingestFixtureGuideline } from "../src/server/brand/service";
import { decideApprovalForOwner, decideTaskApprovals, getTaskApprovalView } from "../src/server/dashboard/service";
import { authenticateAgent } from "../src/server/agents/auth";
import { AgentApiError, chatApproval, executeTarget, overview, recordRoomEvent, rolePlaybook, runAudit, taskState, verifyTask, waitForApprovals } from "../src/server/agents/operations";
import { getOrIssueTokens, issueTokens, verifyToken } from "../src/server/tokens/service";
import { buildRoomTemplate } from "../src/server/tokens/room-template";
import { createBrand, addMembership } from "../src/server/db/repositories";
import { createSessionValue, readSessionValue } from "../src/server/auth/session";

const saved = { db: process.env.MARKPATH_DB_PATH, ws: process.env.MARKPATH_FIXTURE_WORKSPACE };
const dirs: string[] = [];
afterEach(() => {
  for (const [key, value] of [["MARKPATH_DB_PATH", saved.db], ["MARKPATH_FIXTURE_WORKSPACE", saved.ws]] as const) { if (value) process.env[key] = value; else delete process.env[key]; }
  dirs.splice(0).forEach((dir) => { closeDatabase(join(dir, "db.sqlite")); rmSync(dir, { recursive: true, force: true }); });
});

async function stage() {
  const dir = mkdtempSync(join(tmpdir(), "markpath-agents-")); dirs.push(dir);
  process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite"); process.env.MARKPATH_FIXTURE_WORKSPACE = join(dir, "ws");
  const { user, brand } = await seedDatabase(process.env.MARKPATH_DB_PATH);
  const version = await ingestFixtureGuideline(brand.id, user.id); approveSpec(brand.id, user.id, version.id);
  return { user, brand, db: getDatabase(process.env.MARKPATH_DB_PATH) };
}
const status = async (promise: Promise<unknown>) => promise.then(() => 200, (error) => (error instanceof AgentApiError ? error.status : 500));

describe("agent tokens", () => {
  it("maps each token to its own role and rejects unknown ones", async () => {
    await stage();
    process.env.MARKPATH_AGENT_TOKEN_QA = "qa-token"; process.env.MARKPATH_AGENT_TOKEN_DESIGN = "design-token";
    expect(authenticateAgent("Bearer qa-token")?.role).toBe("qa"); expect(authenticateAgent("Bearer design-token")?.role).toBe("design");
    expect(authenticateAgent("Bearer nope")).toBeNull(); expect(authenticateAgent(null)).toBeNull();
    delete process.env.MARKPATH_AGENT_TOKEN_QA; delete process.env.MARKPATH_AGENT_TOKEN_DESIGN;
  });
});

describe("workspace tokens", () => {
  it("scopes a token to its workspace and revokes the old one on re-issue", async () => {
    const { user, brand, db } = await stage();
    const other = createBrand(db, { name: "Other", description: "", approvalOwner: user.id }); addMembership(db, user.id, other.id, "owner");
    const first = issueTokens(brand.id); const otherTokens = issueTokens(other.id);
    expect(verifyToken(first.director)).toEqual({ brandId: brand.id, role: "director" });
    expect(verifyToken(otherTokens.qa)).toEqual({ brandId: other.id, role: "qa" });
    expect(verifyToken("mp_nope")).toBeNull();
    const second = issueTokens(brand.id);
    expect(verifyToken(first.director)).toBeNull(); expect(verifyToken(second.director)).toEqual({ brandId: brand.id, role: "director" });
    expect(db.prepare("SELECT COUNT(*) AS n FROM api_tokens WHERE token_hash = ?").get(first.director)).toEqual({ n: 0 }); // only hashes stored
  });
  it("blocks reaching another workspace's task and embeds keys in the room template", async () => {
    const { user, brand, db } = await stage();
    const other = createBrand(db, { name: "Other", description: "", approvalOwner: user.id }); addMembership(db, user.id, other.id, "owner");
    const audit = await runAudit({ role: "director", brandId: brand.id }, {}) as { taskId: string };
    expect(() => taskState({ brandId: other.id }, audit.taskId)).toThrow("Task not found");
    const { yaml } = await buildRoomTemplate(brand.id, "http://localhost:3000/");
    expect(yaml).not.toContain("MARKPATH_TOKEN_"); expect(yaml).not.toContain("MARKPATH_BASE_URL"); expect(yaml).not.toContain("{team}"); expect(yaml).toContain("markpath-director"); expect(yaml).toContain("Bearer mp_");
    const token = /Bearer (mp_[0-9a-f]+)/.exec(yaml)![1]; expect(verifyToken(token)?.brandId).toBe(brand.id);
  }, 30_000);
});

describe("approval wait and playbooks", () => {
  it("long-polls until a human decides, then the playbook mentions the right agents", async () => {
    const { user, brand, db } = await stage(); const ctx = { role: "director" as const, brandId: brand.id };
    const audit = await runAudit(ctx, {}) as { taskId: string };
    expect(await waitForApprovals(ctx, audit.taskId, 1)).toMatchObject({ decided: false, pending: 2 });
    const approvals = db.prepare("SELECT id FROM approvals WHERE task_id = ?").all(audit.taskId) as Array<{ id: string }>;
    const waiting = waitForApprovals(ctx, audit.taskId, 30);
    setTimeout(() => approvals.forEach((a) => decideApprovalForOwner(db, { approvalId: a.id, userId: user.id, decision: "approved" })), 1200);
    expect(await waiting).toEqual({ decided: true, approved: 2, rejected: 0 });
    db.prepare("UPDATE brands SET team_prefix = 'mp' WHERE id = ?").run(brand.id);
    const { playbook } = rolePlaybook(ctx, "whatever-the-agent-guessed", "http://localhost:3000");
    expect(playbook).toContain("@mp-design"); expect(playbook).toContain("chat-approval"); expect(playbook).not.toContain("@markpath-"); expect(playbook).not.toContain("whatever");
  }, 40_000);
});

describe("stable room template", () => {
  it("re-issues the same keys, rotates only on request, and stores no plaintext", async () => {
    const { brand, db } = await stage();
    const first = await buildRoomTemplate(brand.id, "http://localhost:3000"); const again = await buildRoomTemplate(brand.id, "http://localhost:3000");
    expect(first.rotated).toBe(true); expect(again.rotated).toBe(false); expect(again.yaml).toBe(first.yaml);
    const token = /Bearer (mp_[0-9a-f]+)/.exec(first.yaml)![1];
    expect(JSON.stringify(db.prepare("SELECT * FROM api_tokens").all())).not.toContain(token);
    const rotated = await buildRoomTemplate(brand.id, "http://localhost:3000", { rotate: true });
    expect(rotated.rotated).toBe(true); expect(rotated.yaml).not.toBe(first.yaml); expect(verifyToken(token)).toBeNull();
    expect(getOrIssueTokens(brand.id, ["director", "design", "implementation", "qa"]).rotated).toBe(false);
  }, 30_000);
});

describe("approve from chat link", () => {
  it("lets the owner decide a whole task at once and nobody else", async () => {
    const { user, brand, db } = await stage();
    const audit = await runAudit({ role: "director", brandId: brand.id }, {}) as { taskId: string };
    const view = getTaskApprovalView(db, audit.taskId, user.id)!;
    expect(view.isOwner).toBe(true); expect(view.items).toHaveLength(2); expect(view.items.every((i) => i.findings.length > 0)).toBe(true);
    expect(getTaskApprovalView(db, audit.taskId, "someone-else")).toBeNull();
    expect(decideTaskApprovals(db, { taskId: audit.taskId, userId: user.id, decision: "approved" })).toBe(2);
    expect(getTaskApprovalView(db, audit.taskId, user.id)!.items.every((i) => i.decision === "approved")).toBe(true);
    expect(decideTaskApprovals(db, { taskId: audit.taskId, userId: user.id, decision: "approved" })).toBe(0);
  }, 30_000);
});

describe("approve by chat reply", () => {
  it("accepts only an explicit reply from a recognised owner, once, and labels it as relayed", async () => {
    const { brand, db } = await stage(); const dir = { role: "director" as const, brandId: brand.id };
    const audit = await runAudit(dir, {}) as { taskId: string };
    const msg = (over: Partial<{ senderHandle: string; messageId: string; quote: string }> = {}) => ({ taskId: audit.taskId, senderHandle: "@switch-admin:localhost", roomId: "room-1", messageId: "m-1", quote: "@mp-director approve", ...over });
    expect(await status(Promise.resolve().then(() => chatApproval({ role: "design", brandId: brand.id }, msg())))).toBe(403); // only the Director relays
    expect(await status(Promise.resolve().then(() => chatApproval(dir, msg({ quote: "looks fine I guess" }))))).toBe(422);
    expect(await status(Promise.resolve().then(() => chatApproval(dir, msg({ senderHandle: "@someone-else:localhost" }))))).toBe(403);
    const done = chatApproval(dir, msg({ senderHandle: "user" })); // Switch tells agents only "a user": attributed to the sole owner
    expect(done.decidedBy).toBeTruthy();
    expect(done).toMatchObject({ decision: "approved", decidedOperations: 2, channel: "chat_relayed" });
    expect(db.prepare("SELECT DISTINCT decision_channel FROM approvals").all()).toEqual([{ decision_channel: "chat_relayed" }]);
    expect(await status(Promise.resolve().then(() => chatApproval(dir, msg({ senderHandle: "user" }))))).toBe(409); // same message cannot be replayed
    const label = db.prepare("SELECT status FROM agent_activity WHERE activity_type = 'approval_decision'").get() as { status: string };
    expect(label.status).toContain("relayed"); expect(label.status).toContain("not login-verified"); expect(label.status).toContain("sole workspace owner");
    await executeTarget({ role: "implementation", brandId: brand.id }, { taskId: audit.taskId, target: "github" }); // approvals from chat unlock execution
  }, 30_000);
});

describe("talking to the agents naturally", () => {
  it("accepts plain yes/no phrasing but not hedged or conditional replies", async () => {
    const { brand, db } = await stage(); const dir = { role: "director" as const, brandId: brand.id };
    const audit = await runAudit(dir, {}) as { taskId: string };
    const reply = (quote: string, n: number) => () => chatApproval(dir, { taskId: audit.taskId, senderHandle: "user", roomId: "r", messageId: `m-${n}`, quote });
    for (const [i, q] of ["yes but change the colour first", "approve the colours but not the radius", "go ahead?", "maybe later", "yes I think so, why does it need 2?"].entries()) expect(reply(q, i)).toThrow("plain yes or no");
    expect(reply("@mp-director approve changes", 10)()).toMatchObject({ decision: "approved" });
    const second = await runAudit(dir, {}) as { taskId: string }; void second;
    expect(db.prepare("SELECT COUNT(*) AS n FROM approvals WHERE decision = 'approved'").get()).toEqual({ n: 2 });
  }, 30_000);
  it("recognises common affirmations and refusals", async () => {
    const { brand } = await stage(); const dir = { role: "director" as const, brandId: brand.id };
    const phrases: Array<[string, "approved" | "rejected"]> = [["Yes please", "approved"], ["go ahead!", "approved"], ["Ship it", "approved"], ["LGTM", "approved"], ["looks good", "approved"], ["Approve all", "approved"], ["No", "rejected"], ["hold off", "rejected"], ["don't do it", "rejected"], ["Reject changes", "rejected"], ["stop", "rejected"]];
    for (const [i, [quote, expected]] of phrases.entries()) {
      const a = await runAudit(dir, {}) as { taskId: string; reused?: boolean };
      const out = chatApproval(dir, { taskId: a.taskId, senderHandle: "user", roomId: "r", messageId: `p-${i}`, quote }); expect(out.decision).toBe(expected);
      if (expected === "approved") { /* leave the task approved; next loop reuses nothing because the audit creates a new one only when none is active */ }
      getDatabase().prepare("UPDATE tasks SET status = 'FAILED' WHERE id = ?").run(a.taskId);
    }
  }, 60_000);
  it("answers 'what is going on' in one call and lets Implementation review pull requests", async () => {
    const { brand } = await stage(); const dir = { role: "director" as const, brandId: brand.id };
    const before = overview(dir); expect(before.openIssues).toEqual([]); expect(before.waitingForApproval).toEqual([]);
    await runAudit(dir, {});
    const after = overview({ role: "qa", brandId: brand.id });
    expect(after.issues.length).toBeGreaterThan(0); expect(after.waitingForApproval).toHaveLength(1); expect(after.connections.map((c: { provider: string }) => c.provider).sort()).toEqual(["canva", "figma", "github", "switch"]);
    expect(rolePlaybook(dir, "x", "http://b").playbook).toContain("WHAT PEOPLE MIGHT ASK THE DIRECTOR");
    expect(rolePlaybook({ role: "design", brandId: brand.id }, "x", "http://b").playbook).toContain("HOW PEOPLE TALK TO YOU");
  }, 30_000);
});

describe("session expiry", () => {
  it("rejects an expired session", () => {
    const old = createSessionValue("user-1", Date.now() - 13 * 60 * 60 * 1000);
    expect(readSessionValue(old)).toBeNull();
    expect(readSessionValue(createSessionValue("user-1"))).toBe("user-1");
  });
});

describe("agent-driven workflow", () => {
  it("runs audit, approval, execution and QA with enforced roles and honest attribution", async () => {
    const { user, brand, db } = await stage(); const as = (role: "director" | "design" | "implementation" | "qa") => ({ role, brandId: brand.id });
    expect(await status(runAudit(as("design"), {}))).toBe(403);
    const audit = await runAudit(as("director"), {}) as { taskId: string; status: string; pendingApprovals: number };
    expect(audit.status).toBe("AWAITING_APPROVAL"); expect(audit.pendingApprovals).toBe(2);
    expect(await status(executeTarget(as("implementation"), { taskId: audit.taskId, target: "github" }))).toBe(409);
    const approvals = db.prepare("SELECT id FROM approvals WHERE task_id = ?").all(audit.taskId) as Array<{ id: string }>;
    for (const approval of approvals) decideApprovalForOwner(db, { approvalId: approval.id, userId: user.id, decision: "approved" });
    expect(await status(executeTarget(as("design"), { taskId: audit.taskId, target: "github" }))).toBe(403);
    expect(await status(verifyTask(as("qa"), { taskId: audit.taskId }))).toBe(409); // nothing executed yet
    await executeTarget(as("implementation"), { taskId: audit.taskId, target: "github" });
    expect(await status(executeTarget(as("implementation"), { taskId: audit.taskId, target: "github" }))).toBe(409); // approval is single use
    await executeTarget(as("design"), { taskId: audit.taskId, target: "figma" });
    expect(await status(verifyTask(as("implementation"), { taskId: audit.taskId }))).toBe(403);
    const report = await verifyTask(as("qa"), { taskId: audit.taskId });
    expect(report.status).toBe("COMPLETED");
    const state = taskState({ brandId: brand.id }, audit.taskId);
    expect(state.status).toBe("COMPLETED");
    const actors = (db.prepare("SELECT DISTINCT agent_name FROM agent_activity").all() as Array<{ agent_name: string }>).map((row) => row.agent_name);
    expect(actors).toEqual(expect.arrayContaining(["Brand Director", "Implementation Agent", "Design Agent", "Brand QA"]));
    expect(actors.some((name) => name.startsWith("Human: "))).toBe(true);
    expect(db.prepare("SELECT COUNT(*) AS n FROM agent_activity WHERE agent_name = 'Brand Director' AND activity_type = 'approval_decision'").get()).toEqual({ n: 0 });
    recordRoomEvent(as("director"), { roomId: "room-1", messageId: "m-1", taskId: audit.taskId });
    expect(db.prepare("SELECT message_reference FROM agent_activity WHERE activity_type = 'room_message'").get()).toEqual({ message_reference: "room-1:m-1" });
  }, 30_000);
});
