import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

export type OverviewData = {
  issueCount: number;
  findingCount: number;
  criticalOrHighCount: number;
  pendingApprovalCount: number;
  completedTaskCount: number;
  connectedPlatformCount: number;
  recentActivity: ActivityRow[];
};

export type FindingRow = {
  id: string; provider: string | null; resource_name: string; resource_url: string | null;
  rule_id: string; detected_value: string | null; expected_value: string | null;
  severity: string; confidence: number; evidence: string; recommended_action: string;
  classification: string; status: string; created_at: string;
};

export type ApprovalRow = {
  id: string; decision: string; approved_action: string; created_at: string;
  task_id: string; task_description: string; resource_name: string; resource_ref: string | null; decision_channel: string | null;
};

export type ActivityRow = {
  id: string; agent_name: string; activity_type: string; status: string;
  message_reference: string | null; created_at: string; task_description: string | null;
};

export type IntegrationRow = { provider: string; connection_status: string; mode: string; last_checked_at: string | null };

function count(db: Database.Database, sql: string, brandId: string) {
  return (db.prepare(sql).get(brandId) as { count: number }).count;
}

export function getOverviewData(db: Database.Database, brandId: string): OverviewData {
  return {
    // Places = open findings; issues = the same rule in the same file grouped (what the Issues page shows).
    findingCount: count(db, "SELECT COUNT(*) AS count FROM findings WHERE brand_id = ? AND status = 'open' AND classification != 'compliant'", brandId),
    issueCount: count(db, "SELECT COUNT(*) AS count FROM (SELECT DISTINCT resource_id, rule_id, expected_value FROM findings WHERE brand_id = ? AND status = 'open' AND classification != 'compliant')", brandId),
    criticalOrHighCount: count(db, "SELECT COUNT(*) AS count FROM (SELECT DISTINCT resource_id, rule_id, expected_value FROM findings WHERE brand_id = ? AND status = 'open' AND severity IN ('critical', 'high') AND classification != 'compliant')", brandId),
    pendingApprovalCount: count(db, "SELECT COUNT(*) AS count FROM approvals a JOIN tasks t ON t.id = a.task_id WHERE t.brand_id = ? AND a.decision = 'pending'", brandId),
    completedTaskCount: count(db, "SELECT COUNT(*) AS count FROM tasks WHERE brand_id = ? AND status IN ('COMPLETED', 'PARTIALLY_COMPLETED')", brandId),
    connectedPlatformCount: count(db, "SELECT COUNT(*) AS count FROM integrations WHERE brand_id = ? AND connection_status = 'connected'", brandId),
    recentActivity: getActivity(db, brandId, 5),
  };
}

export function getIntegrations(db: Database.Database, brandId: string) {
  return db.prepare("SELECT provider, connection_status, mode, last_checked_at FROM integrations WHERE brand_id = ? ORDER BY provider").all(brandId) as IntegrationRow[];
}

export function getFindings(db: Database.Database, brandId: string, filters: { provider?: string; severity?: string; status?: string; classification?: string } = {}) {
  const clauses = ["f.brand_id = ?"];
  const values: string[] = [brandId];
  if (filters.provider) { clauses.push("i.provider = ?"); values.push(filters.provider); }
  if (filters.severity) { clauses.push("f.severity = ?"); values.push(filters.severity); }
  if (filters.status) { clauses.push("f.status = ?"); values.push(filters.status); }
  if (filters.classification) { clauses.push("f.classification = ?"); values.push(filters.classification); }
  return db.prepare(`SELECT f.id, i.provider, r.resource_name, r.resource_url, f.rule_id, f.detected_value, f.expected_value,
    f.severity, f.confidence, f.evidence, f.recommended_action, f.classification, f.status, f.created_at
    FROM findings f JOIN resources r ON r.id = f.resource_id LEFT JOIN integrations i ON i.id = r.integration_id
    WHERE ${clauses.join(" AND ")} ORDER BY CASE f.severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC, f.created_at DESC`).all(...values) as FindingRow[];
}

export function getApprovals(db: Database.Database, brandId: string) {
  return db.prepare(`SELECT a.id, a.decision, a.approved_action, a.created_at, a.decision_channel, t.id AS task_id, t.description AS task_description, r.resource_name, r.external_resource_id AS resource_ref
    FROM approvals a JOIN tasks t ON t.id = a.task_id JOIN resources r ON r.id = a.resource_id
    WHERE t.brand_id = ? ORDER BY CASE a.decision WHEN 'pending' THEN 0 ELSE 1 END, a.created_at DESC`).all(brandId) as ApprovalRow[];
}

export function getActivity(db: Database.Database, brandId: string, limit = 50) {
  return db.prepare(`SELECT a.id, a.agent_name, a.activity_type, a.status, a.message_reference, a.created_at, t.description AS task_description
    FROM agent_activity a LEFT JOIN tasks t ON t.id = a.task_id WHERE a.brand_id = ? ORDER BY a.created_at DESC LIMIT ?`).all(brandId, limit) as ActivityRow[];
}

export function decideApprovalForOwner(db: Database.Database, input: { approvalId: string; userId: string; decision: "approved" | "rejected" }) {
  const approval = db.prepare(`SELECT a.task_id, t.brand_id FROM approvals a JOIN tasks t ON t.id = a.task_id WHERE a.id = ? AND a.decision = 'pending'`).get(input.approvalId) as { task_id: string; brand_id: string } | undefined;
  if (!approval) throw new Error("Pending approval not found.");
  const membership = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(input.userId, approval.brand_id) as { role: string } | undefined;
  if (membership?.role !== "owner") throw new Error("Only the workspace owner can decide this approval.");
  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(input.userId) as { name: string } | undefined;
  db.transaction(() => {
    db.prepare("UPDATE approvals SET decision = ?, approved_by = ?, decision_channel = 'dashboard' WHERE id = ?").run(input.decision, input.userId, input.approvalId);
    db.prepare("UPDATE tasks SET approval_status = ? WHERE id = ?").run(input.decision, approval.task_id);
    db.prepare(`INSERT INTO agent_activity (id, brand_id, task_id, agent_name, activity_type, message_reference, status, created_at) VALUES (?, ?, ?, ?, 'approval_decision', NULL, ?, ?)`)
      .run(randomUUID(), approval.brand_id, approval.task_id, `Human: ${user?.name ?? "approver"}`, input.decision.toUpperCase(), new Date().toISOString());
  })();
}

export function switchRoomReplyCount(db: Database.Database, brandId: string) {
  return (db.prepare("SELECT COUNT(*) AS n FROM agent_activity WHERE brand_id = ? AND activity_type = 'room_message' AND message_reference IS NOT NULL").get(brandId) as { n: number }).n;
}

export function decideTaskApprovals(db: Database.Database, input: { taskId: string; userId: string; decision: "approved" | "rejected" }) {
  const pending = db.prepare("SELECT id FROM approvals WHERE task_id = ? AND decision = 'pending'").all(input.taskId) as Array<{ id: string }>;
  for (const approval of pending) decideApprovalForOwner(db, { approvalId: approval.id, userId: input.userId, decision: input.decision });
  return pending.length;
}

export type TaskApprovalView = { task: { id: string; description: string; status: string; brand_id: string }; isOwner: boolean; items: Array<{ id: string; decision: string; resource_name: string; resource_ref: string | null; approved_action: string; needsPerson: number }> };
export function getTaskApprovalView(db: Database.Database, taskId: string, userId: string): TaskApprovalView | null {
  const task = db.prepare("SELECT t.id, t.description, t.status, t.brand_id FROM tasks t JOIN memberships m ON m.brand_id = t.brand_id AND m.user_id = ? WHERE t.id = ?").get(userId, taskId) as TaskApprovalView["task"] | undefined;
  if (!task) return null;
  const role = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, task.brand_id) as { role: string } | undefined;
  const approvals = db.prepare("SELECT a.id, a.decision, a.resource_id, a.approved_action, r.resource_name, r.external_resource_id AS resource_ref FROM approvals a JOIN resources r ON r.id = a.resource_id WHERE a.task_id = ? ORDER BY r.resource_name").all(taskId) as Array<{ id: string; decision: string; resource_id: string; approved_action: string; resource_name: string; resource_ref: string | null }>;
  // Items only a person can resolve (contrast, tone, logo, placeholders) are not part of what is being approved; they are counted so the page can say so.
  const items = approvals.map((a) => ({ id: a.id, decision: a.decision, resource_name: a.resource_name, resource_ref: a.resource_ref, approved_action: a.approved_action, needsPerson: (db.prepare("SELECT COUNT(*) AS n FROM findings WHERE resource_id = ? AND status = 'open' AND classification = 'needs_review'").get(a.resource_id) as { n: number }).n }));
  return { task, isOwner: role?.role === "owner", items };
}

/** Resources where an approved fix was applied but Brand QA hasn't verified it yet (issues stay open until QA checks). */
export function fixesAwaitingQa(db: Database.Database, brandId: string) {
  return db.prepare(`SELECT DISTINCT e.resource_id AS resourceId, e.executed_at AS appliedAt FROM execution_records e JOIN tasks t ON t.id = e.task_id
    WHERE t.brand_id = ? AND t.status NOT IN ('COMPLETED','PARTIALLY_COMPLETED','FAILED','REJECTED') AND e.resource_id IS NOT NULL`).all(brandId) as Array<{ resourceId: string; appliedAt: string }>;
}
