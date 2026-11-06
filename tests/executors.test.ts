import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDatabase, closeDatabase } from "../src/server/db/client";
import { initializeSchema } from "../src/server/db/schema";
import { addMembership, createBrand, createUser } from "../src/server/db/repositories";
import { createTask } from "../src/server/tasks/service";
import { executeFigmaFixture, executeGithubFixture } from "../src/server/executors/fixture-executors";

const previous = process.env.MARKPATH_DB_PATH; const directories: string[] = [];
function unapprovedOperation() { const dir = mkdtempSync(join(tmpdir(), "markpath-exec-")); directories.push(dir); const path = join(dir, "db.sqlite"); process.env.MARKPATH_DB_PATH = path; const db = getDatabase(path); initializeSchema(db); const user = createUser(db, { email: `${Math.random()}@test.local`, name: "Tester", password_hash: "x" }); const brand = createBrand(db, { name: "Test", description: "", approvalOwner: user.id }); addMembership(db, user.id, brand.id, "owner"); db.prepare("INSERT INTO resources (id, brand_id, resource_type, resource_name, status, created_at) VALUES ('r', ?, 'fixture', 'Fixture', 'uninspected', ?)").run(brand.id, new Date().toISOString()); const task = createTask({ brandId: brand.id, initiatedBy: user.id, type: "correction", description: "", idempotencyKey: Math.random().toString() }).task; return { taskId: task.id, resourceId: "r", operation: { resourceId: "r", operation: "replace_tokens", payload: { from: "old", to: "new" } } }; }
afterEach(() => { if (previous) process.env.MARKPATH_DB_PATH = previous; else delete process.env.MARKPATH_DB_PATH; directories.splice(0).forEach((dir) => { closeDatabase(join(dir, "db.sqlite")); rmSync(dir, { recursive: true, force: true }); }); });
describe("fixture executors", () => { it("refuses unapproved GitHub and Figma changes", async () => { const input = unapprovedOperation(); await expect(executeGithubFixture(input)).rejects.toThrow("does not have an approved"); await expect(executeFigmaFixture(input)).rejects.toThrow("does not have an approved"); }); });
