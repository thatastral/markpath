import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { approveSpec, ingestFixtureGuideline } from "../src/server/brand/service";
import { decideTaskApprovals } from "../src/server/dashboard/service";
import { AgentApiError, executeTarget, figmaScript, figmaVerification, readyForApproval, runAudit, verifyTask } from "../src/server/agents/operations";
import { recordPluginExecution, recordPluginFindings, requestPluginApproval, approvedPluginOperations } from "../src/server/plugin/operations";
import { parseFigmaFileKey, saveFigmaFile } from "../src/server/integrations/figma";

const saved = { db: process.env.MARKPATH_DB_PATH, ws: process.env.MARKPATH_FIXTURE_WORKSPACE }; const dirs: string[] = [];
afterEach(() => { for (const [k, v] of [["MARKPATH_DB_PATH", saved.db], ["MARKPATH_FIXTURE_WORKSPACE", saved.ws]] as const) { if (v) process.env[k] = v; else delete process.env[k]; } dirs.splice(0).forEach((d) => { closeDatabase(join(d, "db.sqlite")); rmSync(d, { recursive: true, force: true }); }); });
const status = async (p: Promise<unknown>) => p.then(() => 200, (e) => (e instanceof AgentApiError ? e.status : 500));

describe("Figma through the MCP", () => {
  it("parses file links", () => {
    expect(parseFigmaFileKey("https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt/Untitled?node-id=0-1&p=f")).toBe("kdLxaaGP6dR3ftXJpDCKjt");
    expect(parseFigmaFileKey("not a link")).toBeNull();
  });
  it("runs audit, a Design-agent approval, MCP apply report and a QA re-read, and refuses to finish without the QA report", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-figma-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite"); process.env.MARKPATH_FIXTURE_WORKSPACE = join(dir, "ws");
    const { user, brand } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
    const version = await ingestFixtureGuideline(brand.id, user.id); approveSpec(brand.id, user.id, version.id);
    saveFigmaFile(brand.id, "https://www.figma.com/design/kdLxaaGP6dR3ftXJpDCKjt/Untitled");
    const as = (role: "director" | "design" | "implementation" | "qa") => ({ role, brandId: brand.id });
    const audit = await runAudit(as("director")) as { taskId: string; status: string; figma?: { url: string }; pendingApprovals: number };
    expect(audit.figma?.url).toContain("kdLxaaGP6dR3ftXJpDCKjt"); expect(audit.status).toBe("PLAN_READY"); expect(audit.pendingApprovals).toBe(1); // GitHub only until Design adds Figma
    const script = await figmaScript(as("design"), "apply");
    expect(script.code).toContain('"to":{"primaryColour":"#2457F5"'); expect(script.code).toContain("figma.variables"); expect(await status(figmaScript(as("director"), "apply") as Promise<unknown>)).toBe(403);
    recordPluginFindings(brand.id, { fileName: "Nexa design", findings: [{ nodeName: "Orb", property: "colour", detected: "#164B9B", expected: "#2457F5" }] });
    expect((db.prepare("SELECT connection_status FROM integrations WHERE brand_id = ? AND provider = 'figma'").get(brand.id) as { connection_status: string }).connection_status).toBe("connected");
    const { approvalId } = requestPluginApproval(brand.id, { fileName: "Nexa design", changes: [{ property: "colour", from: "#164B9B", to: "#2457F5", count: 6 }] });
    expect(readyForApproval(as("director"), audit.taskId)).toMatchObject({ status: "AWAITING_APPROVAL", pendingApprovals: 2 });
    expect(await status(executeTarget(as("implementation"), { taskId: audit.taskId, target: "github" }))).toBe(409); // approvals pending
    expect(decideTaskApprovals(db, { taskId: audit.taskId, userId: user.id, decision: "approved" })).toBe(2);
    await executeTarget(as("implementation"), { taskId: audit.taskId, target: "github" });
    expect(approvedPluginOperations(brand.id).operations).toHaveLength(1);
    recordPluginExecution(brand.id, { approvalId, before: { colour: 6, typeface: 5, radius: 5 }, after: { colour: 0, typeface: 0, radius: 0 }, reinspected: true, remainingOutdated: 0, via: "mcp" });
    expect(db.prepare("SELECT mode FROM execution_records WHERE operation = 'apply_in_figma_plugin'").get()).toEqual({ mode: "figma_mcp" });
    expect(await status(verifyTask(as("qa"), { taskId: audit.taskId }))).toBe(409); // QA has not re-read Figma yet
    expect(await status(Promise.resolve().then(() => figmaVerification(as("design"), { taskId: audit.taskId, counts: { colour: 0, typeface: 0, radius: 0 } })))).toBe(403);
    expect(figmaVerification(as("qa"), { taskId: audit.taskId, counts: { colour: 0, typeface: 0, radius: 2 } }).verified).toBe(false); // outdated values remain: not verified
    const report = figmaVerification(as("qa"), { taskId: audit.taskId, counts: { colour: 0, typeface: 0, radius: 0 }, checkedNodeIds: ["3:21"] });
    expect(report.verified).toBe(true);
    const done = await verifyTask(as("qa"), { taskId: audit.taskId });
    expect(done.status).toBe("COMPLETED");
  }, 40_000);
});
