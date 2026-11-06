import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDatabase, closeDatabase } from "../src/server/db/client";
import { initializeSchema } from "../src/server/db/schema";
import { addMembership, createBrand, createUser } from "../src/server/db/repositories";
import { createTask, addTaskResource, decideApproval, finishVerification, isApprovedOperation, requestApproval, transitionTask, updateTaskResource } from "../src/server/tasks/service";

const originalPath = process.env.MARKPATH_DB_PATH; const directories: string[] = [];
function setup() { const dir = mkdtempSync(join(tmpdir(), "markpath-task-")); directories.push(dir); const path = join(dir, "db.sqlite"); process.env.MARKPATH_DB_PATH = path; const db = getDatabase(path); initializeSchema(db); const user = createUser(db, { email: `${Math.random()}@test.local`, name: "Tester", password_hash: "x" }); const brand = createBrand(db, { name: "Test brand", description: "", approvalOwner: user.id }); addMembership(db, user.id, brand.id, "owner"); const resource = { id: "resource-1" }; db.prepare("INSERT INTO resources (id, brand_id, resource_type, resource_name, status, created_at) VALUES (?, ?, 'repository', 'Fixture', 'uninspected', ?)").run(resource.id, brand.id, new Date().toISOString()); return { path, user, brand, resource }; }
afterEach(() => { if (originalPath) process.env.MARKPATH_DB_PATH = originalPath; else delete process.env.MARKPATH_DB_PATH; directories.splice(0).forEach((dir) => { closeDatabase(join(dir, "db.sqlite")); rmSync(dir, { recursive: true, force: true }); }); });

describe("task engine", () => {
  it("rejects invalid task transitions and makes creation idempotent", () => {
    const { user, brand } = setup(); const first = createTask({ brandId: brand.id, initiatedBy: user.id, type: "audit", description: "Audit", idempotencyKey: "same" }); const second = createTask({ brandId: brand.id, initiatedBy: user.id, type: "audit", description: "Audit", idempotencyKey: "same" });
    expect(first.created).toBe(true); expect(second.created).toBe(false); expect(second.task.id).toBe(first.task.id); expect(() => transitionTask(first.task.id, "COMPLETED", "QA")).toThrow("Invalid task transition");
  });
  it("requires verified resources before completion", () => {
    const { user, brand, resource } = setup(); const task = createTask({ brandId: brand.id, initiatedBy: user.id, type: "audit", description: "Audit", idempotencyKey: "verify" }).task; addTaskResource(task.id, resource.id); transitionTask(task.id, "ASSESSING", "Director"); transitionTask(task.id, "AUDITING", "Director"); transitionTask(task.id, "PLAN_READY", "Director"); transitionTask(task.id, "AWAITING_APPROVAL", "Director"); transitionTask(task.id, "APPROVED", "Director"); transitionTask(task.id, "IMPLEMENTING", "Implementation"); transitionTask(task.id, "VERIFYING", "QA"); expect(finishVerification(task.id).status).toBe("PARTIALLY_COMPLETED");
  });
  it("binds approvals to exactly one resource and operation", () => {
    const { user, brand, resource } = setup(); const task = createTask({ brandId: brand.id, initiatedBy: user.id, type: "audit", description: "Audit", idempotencyKey: "approve" }).task; transitionTask(task.id, "ASSESSING", "Director"); transitionTask(task.id, "PLAN_READY", "Director"); const operation = { resourceId: resource.id, operation: "replace_token", payload: { from: "#164B9B", to: "#2457F5" } }; const approval = requestApproval(task.id, user.id, operation); decideApproval({ approvalId: approval, userId: user.id, decision: "approved" }); expect(isApprovedOperation(task.id, operation)).toBe(approval); expect(isApprovedOperation(task.id, { ...operation, payload: { from: "#164B9B", to: "#FFFFFF" } })).toBeNull(); expect(isApprovedOperation(task.id, { ...operation, resourceId: "other-resource" })).toBeNull();
  });
  it("completes only when resource evidence is present", () => {
    const { user, brand, resource } = setup(); const task = createTask({ brandId: brand.id, initiatedBy: user.id, type: "audit", description: "Audit", idempotencyKey: "complete" }).task; addTaskResource(task.id, resource.id); transitionTask(task.id, "ASSESSING", "Director"); transitionTask(task.id, "AUDITING", "Director"); transitionTask(task.id, "PLAN_READY", "Director"); transitionTask(task.id, "AWAITING_APPROVAL", "Director"); transitionTask(task.id, "APPROVED", "Director"); transitionTask(task.id, "IMPLEMENTING", "Implementation"); transitionTask(task.id, "VERIFYING", "QA"); updateTaskResource({ taskId: task.id, resourceId: resource.id, status: "COMPLETED", verificationEvidence: { verified: true } }); expect(finishVerification(task.id).status).toBe("COMPLETED");
  });
});
