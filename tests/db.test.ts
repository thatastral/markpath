import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDatabase, closeDatabase } from "../src/server/db/client";
import { initializeSchema } from "../src/server/db/schema";
import { seedDatabase, DEMO_USER } from "../src/server/db/seed";
import { findUserByEmail } from "../src/server/db/repositories";

const directories: string[] = [];
const pathForTest = () => { const dir = mkdtempSync(join(tmpdir(), "markpath-test-")); directories.push(dir); return join(dir, "markpath.sqlite"); };
afterEach(() => directories.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("database foundation", () => {
  it("creates every core table", () => {
    const path = pathForTest(); const db = getDatabase(path); initializeSchema(db);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => (row as { name: string }).name);
    for (const table of ["brands", "users", "memberships", "integrations", "resources", "findings", "tasks", "approvals", "execution_records", "agent_activity"]) expect(tables).toContain(table);
    closeDatabase(path);
  });
  it("seeds Nexa idempotently", async () => {
    const path = pathForTest(); await seedDatabase(path); await seedDatabase(path);
    const db = getDatabase(path);
    expect(findUserByEmail(db, DEMO_USER.email)?.name).toBe(DEMO_USER.name);
    expect((db.prepare("SELECT COUNT(*) AS count FROM brands WHERE name='Nexa'").get() as { count: number }).count).toBe(1);
    expect((db.prepare("SELECT COUNT(*) AS count FROM integrations").get() as { count: number }).count).toBe(4);
    closeDatabase(path);
  });
});
