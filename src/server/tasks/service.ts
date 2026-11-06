import { createHash, randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { assertTransition, type TaskState } from "./state-machine";

type TaskRow = { id: string; brand_id: string; status: TaskState; completed_at: string | null };
type TaskResourceRow = { id: string; resource_id: string; status: TaskState; required: number; verification_evidence: string | null; error: string | null };
const now = () => new Date().toISOString();

export type ProposedOperation = { resourceId: string; operation: string; payload: Record<string, unknown> };
export function operationFingerprint(operation: ProposedOperation) {
  const payload = Object.keys(operation.payload).sort().reduce<Record<string, unknown>>((ordered, key) => ({ ...ordered, [key]: operation.payload[key] }), {});
  return createHash("sha256").update(JSON.stringify({ resourceId: operation.resourceId, operation: operation.operation, payload })).digest("hex");
}

function appendActivity(task: TaskRow, agentName: string, activityType: string, status: string, messageReference?: string) {
  const db = getDatabase();
  db.prepare(`INSERT INTO agent_activity (id, brand_id, task_id, agent_name, activity_type, message_reference, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), task.brand_id, task.id, agentName, activityType, messageReference ?? null, status, now());
}

function taskById(taskId: string) {
  const db = getDatabase(); initializeSchema(db);
  const task = db.prepare("SELECT id, brand_id, status, completed_at FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
  if (!task) throw new Error("Task not found.");
  return task;
}

export function createTask(input: { brandId: string; initiatedBy: string; type: string; description: string; idempotencyKey: string; agentName?: string }) {
  const db = getDatabase(); initializeSchema(db);
  const existing = db.prepare("SELECT id, brand_id, status, completed_at FROM tasks WHERE idempotency_key = ?").get(input.idempotencyKey) as TaskRow | undefined;
  if (existing) return { task: existing, created: false };
  const task: TaskRow = { id: randomUUID(), brand_id: input.brandId, status: "RECEIVED", completed_at: null };
  db.prepare(`INSERT INTO tasks (id, brand_id, task_type, description, initiated_by, assigned_agent, status, approval_status, idempotency_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED', 'not_requested', ?, ?)`)
    .run(task.id, task.brand_id, input.type, input.description, input.initiatedBy, input.agentName ?? "Brand Director", input.idempotencyKey, now());
  appendActivity(task, input.agentName ?? "Brand Director", "task_received", "RECEIVED");
  return { task, created: true };
}

export function addTaskResource(taskId: string, resourceId: string, required = true) {
  const db = getDatabase(); const task = taskById(taskId);
  db.prepare(`INSERT OR IGNORE INTO task_resources (id, task_id, resource_id, status, required, created_at, updated_at)
    VALUES (?, ?, ?, 'RECEIVED', ?, ?, ?)`).run(randomUUID(), task.id, resourceId, required ? 1 : 0, now(), now());
}

export function transitionTask(taskId: string, next: TaskState, agentName: string) {
  const db = getDatabase(); const task = taskById(taskId); assertTransition(task.status, next);
  db.prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?").run(next, next === "COMPLETED" || next === "PARTIALLY_COMPLETED" ? now() : null, task.id);
  const updated = { ...task, status: next, completed_at: next === "COMPLETED" || next === "PARTIALLY_COMPLETED" ? now() : null };
  appendActivity(updated, agentName, "task_transition", next);
  return updated;
}

export function updateTaskResource(input: { taskId: string; resourceId: string; status: TaskState; verificationEvidence?: Record<string, unknown>; error?: string; actor?: string }) {
  const db = getDatabase(); const task = taskById(input.taskId);
  const existing = db.prepare("SELECT id, resource_id, status, required, verification_evidence, error FROM task_resources WHERE task_id = ? AND resource_id = ?").get(input.taskId, input.resourceId) as TaskResourceRow | undefined;
  if (!existing) throw new Error("Task resource not found.");
  db.prepare("UPDATE task_resources SET status = ?, verification_evidence = ?, error = ?, updated_at = ? WHERE id = ?")
    .run(input.status, input.verificationEvidence ? JSON.stringify(input.verificationEvidence) : null, input.error ?? null, now(), existing.id);
  appendActivity(task, input.actor ?? "Brand QA", "resource_transition", input.status);
}

export function finishVerification(taskId: string) {
  const db = getDatabase(); const task = taskById(taskId);
  if (task.status !== "VERIFYING") throw new Error("A task can only finish verification from VERIFYING.");
  const resources = db.prepare("SELECT id, resource_id, status, required, verification_evidence, error FROM task_resources WHERE task_id = ?").all(task.id) as TaskResourceRow[];
  const required = resources.filter((resource) => resource.required === 1);
  if (required.length === 0) throw new Error("A task needs at least one required resource before completion.");
  const allVerified = required.every((resource) => resource.status === "COMPLETED" && resource.verification_evidence);
  return transitionTask(task.id, allVerified ? "COMPLETED" : "PARTIALLY_COMPLETED", "Brand QA");
}

export function requestApproval(taskId: string, requestedBy: string, operation: ProposedOperation, actor = "Brand Director") {
  const db = getDatabase(); const task = taskById(taskId);
  if (task.status !== "PLAN_READY" && task.status !== "AWAITING_APPROVAL") throw new Error("Approvals can only be requested for a ready plan.");
  const fingerprint = operationFingerprint(operation);
  const existing = db.prepare("SELECT id FROM approvals WHERE task_id = ? AND resource_id = ? AND operation_fingerprint = ?").get(task.id, operation.resourceId, fingerprint) as { id: string } | undefined;
  if (existing) return existing.id;
  const id = randomUUID();
  db.prepare(`INSERT INTO approvals (id, task_id, resource_id, requested_by, decision, approved_action, operation_fingerprint, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`).run(id, task.id, operation.resourceId, requestedBy, JSON.stringify(operation), fingerprint, now());
  db.prepare("UPDATE tasks SET approval_status = 'awaiting_approval' WHERE id = ?").run(task.id);
  appendActivity(task, actor, "approval_requested", "AWAITING_APPROVAL");
  return id;
}

export function decideApproval(input: { approvalId: string; userId: string; decision: "approved" | "rejected" }) {
  const db = getDatabase();
  const approval = db.prepare("SELECT task_id FROM approvals WHERE id = ? AND decision = 'pending'").get(input.approvalId) as { task_id: string } | undefined;
  if (!approval) throw new Error("Pending approval not found.");
  db.prepare("UPDATE approvals SET decision = ?, approved_by = ? WHERE id = ?").run(input.decision, input.userId, input.approvalId);
  const task = taskById(approval.task_id);
  db.prepare("UPDATE tasks SET approval_status = ? WHERE id = ?").run(input.decision, task.id);
  appendActivity(task, "Human approver", "approval_decision", input.decision.toUpperCase());
}

export function isApprovedOperation(taskId: string, operation: ProposedOperation) {
  const db = getDatabase(); const fingerprint = operationFingerprint(operation);
  const row = db.prepare(`SELECT id FROM approvals WHERE task_id = ? AND resource_id = ? AND operation_fingerprint = ? AND decision = 'approved' AND consumed_at IS NULL`)
    .get(taskId, operation.resourceId, fingerprint) as { id: string } | undefined;
  return row?.id ?? null;
}

export function consumeApproval(approvalId: string) {
  const result = getDatabase().prepare("UPDATE approvals SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL").run(now(), approvalId);
  if (result.changes !== 1) throw new Error("Approval was already used or does not exist.");
}

export function recordActivity(input: { brandId: string; taskId?: string | null; agentName: string; activityType: string; status: string; messageReference?: string | null }) {
  getDatabase().prepare(`INSERT INTO agent_activity (id, brand_id, task_id, agent_name, activity_type, message_reference, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), input.brandId, input.taskId ?? null, input.agentName, input.activityType, input.messageReference ?? null, input.status, now());
}
