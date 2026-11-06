import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { approveSpec, ingestFixtureGuideline } from "../src/server/brand/service";
import { decideApprovalForOwner } from "../src/server/dashboard/service";
import { approvedPluginOperations, pluginAuthorized, pluginSpec, recordPluginExecution, requestPluginApproval } from "../src/server/plugin/operations";

const saved = process.env.MARKPATH_DB_PATH; const dirs: string[] = [];
afterEach(() => { if (saved) process.env.MARKPATH_DB_PATH = saved; else delete process.env.MARKPATH_DB_PATH; delete process.env.MARKPATH_PLUGIN_TOKEN; dirs.splice(0).forEach((d) => { closeDatabase(join(d, "db.sqlite")); rmSync(d, { recursive: true, force: true }); }); });

describe("figma plugin backend", () => {
  it("requires a token, a human approval, and refuses reuse", async () => {
    process.env.MARKPATH_PLUGIN_TOKEN = "plugin-secret";
    expect(pluginAuthorized("Bearer plugin-secret")).toBe(true); expect(pluginAuthorized("Bearer wrong")).toBe(false); expect(pluginAuthorized(null)).toBe(false);
    const dir = mkdtempSync(join(tmpdir(), "markpath-plugin-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
    const { user, brand } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
    expect(() => pluginSpec(brand.id)).toThrow("No approved brand specification");
    const version = await ingestFixtureGuideline(brand.id, user.id); approveSpec(brand.id, user.id, version.id);
    expect(pluginSpec(brand.id).expected).toEqual({ primaryColour: "#2457F5", primaryTypeface: "Geist", buttonRadius: "8px" });
    const { approvalId } = requestPluginApproval(brand.id, { fileName: "Nexa", changes: [{ property: "fill", from: "#164B9B", to: "#2457F5", count: 3 }] });
    expect(approvedPluginOperations(brand.id).operations).toHaveLength(0); // pending, not approved
    expect(() => recordPluginExecution(brand.id, { approvalId, before: { fill: 3 }, after: { fill: 0 }, reinspected: true, remainingOutdated: 0 })).toThrow("No unused approved");
    decideApprovalForOwner(db, { approvalId, userId: user.id, decision: "approved" });
    expect(approvedPluginOperations(brand.id).operations).toHaveLength(1);
    const done = recordPluginExecution(brand.id, { approvalId, before: { fill: 3 }, after: { fill: 0 }, reinspected: true, remainingOutdated: 0 });
    expect(done.evidence.label).toContain("not independently verified");
    expect(() => recordPluginExecution(brand.id, { approvalId, before: { fill: 3 }, after: { fill: 0 }, reinspected: true, remainingOutdated: 0 })).toThrow("No unused approved");
  });
});
