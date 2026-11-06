import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { createWorkspace, workspaceInput } from "../src/server/workspace/service";
import { runAudit } from "../src/server/agents/operations";

const saved = process.env.MARKPATH_DB_PATH; const savedWs = process.env.MARKPATH_FIXTURE_WORKSPACE; const dirs: string[] = [];
afterEach(() => { for (const [k, v] of [["MARKPATH_DB_PATH", saved], ["MARKPATH_FIXTURE_WORKSPACE", savedWs]] as const) { if (v) process.env[k] = v; else delete process.env[k]; } dirs.splice(0).forEach((d) => { closeDatabase(join(d, "db.sqlite")); rmSync(d, { recursive: true, force: true }); }); });

describe("workspaces", () => {
  it("creates an isolated workspace with demo data, a chat identity and working audits", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-ws-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite"); process.env.MARKPATH_FIXTURE_WORKSPACE = join(dir, "ws");
    const { user, brand: nexa } = await seedDatabase(process.env.MARKPATH_DB_PATH); const db = getDatabase(process.env.MARKPATH_DB_PATH);
    const second = await createWorkspace(user.id, workspaceInput.parse({ name: "Acme", chatHandle: "@jo", demoData: true }));
    expect(second.id).not.toBe(nexa.id);
    expect(db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(user.id, second.id)).toEqual({ role: "owner" });
    expect(db.prepare("SELECT COUNT(*) AS n FROM integrations WHERE brand_id = ?").get(second.id)).toEqual({ n: 4 });
    expect(db.prepare("SELECT handle FROM chat_identities WHERE brand_id = ?").get(second.id)).toEqual({ handle: "jo" });
    expect((db.prepare("SELECT brand_version FROM brands WHERE id = ?").get(second.id) as { brand_version: string }).brand_version).toBe("2.0");
    const audit = await runAudit({ role: "director", brandId: second.id }, {}) as { status: string };
    expect(audit.status).toBe("AWAITING_APPROVAL");
    expect(db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE brand_id = ?").get(nexa.id)).toEqual({ n: 0 }); // the other workspace is untouched
    expect(() => workspaceInput.parse({ name: "x" })).toThrow();
  }, 30_000);
});
