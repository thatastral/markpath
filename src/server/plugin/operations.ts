import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { verifyToken } from "@/server/tokens/service";
import { figmaMcpConfig } from "@/server/integrations/figma";
import { consumeApproval, createTask, addTaskResource, recordActivity, requestApproval, transitionTask } from "@/server/tasks/service";

export class PluginApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
export const PLUGIN_OPERATION = "apply_in_figma_plugin";
const actor = "Figma plugin";

/** Returns the workspace a plugin token belongs to, or null. The env token is a single-workspace developer fallback. */
export function pluginPrincipal(header: string | null): { brandId: string } | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7); if (!token) return null;
  const issued = verifyToken(token);
  if (issued && (issued.role === "plugin" || issued.role === "design")) return { brandId: issued.brandId };
  const expected = process.env.MARKPATH_PLUGIN_TOKEN;
  if (expected && token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    const row = getDatabase().prepare("SELECT id FROM brands ORDER BY created_at LIMIT 1").get() as { id: string } | undefined; return row ? { brandId: row.id } : null;
  }
  return null;
}
export const pluginAuthorized = (header: string | null) => pluginPrincipal(header) !== null;
function db() { const database = getDatabase(); initializeSchema(database); return database; }
function brand(brandId: string) { const row = db().prepare("SELECT id, name FROM brands WHERE id = ?").get(brandId) as { id: string; name: string } | undefined; if (!row) throw new PluginApiError("No workspace.", 404); return row; }

export function pluginSpec(brandId: string) {
  const b = brand(brandId);
  const row = db().prepare("SELECT specification, version FROM brand_spec_versions WHERE brand_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 1").get(b.id) as { specification: string; version: string } | undefined;
  if (!row) throw new PluginApiError("No approved brand specification yet. Approve it in the dashboard.", 409);
  const rules = (JSON.parse(row.specification) as { rules: Array<{ id: string; expected: string }> }).rules;
  const get = (id: string) => rules.find((rule) => rule.id === id)?.expected;
  return { brand: b.name, version: row.version, figmaMcp: figmaMcpConfig(b.id), expected: { primaryColour: get("primary-colour"), primaryTypeface: get("primary-typeface"), buttonRadius: get("button-radius") }, legacy: { primaryColour: "#164B9B", primaryTypeface: "Inter", buttonRadius: "4px" } };
}

const findingsBody = z.object({ fileName: z.string().max(200), findings: z.array(z.object({ nodeName: z.string().max(200), property: z.string().max(60), detected: z.string().max(60), expected: z.string().max(60) })).max(500) });
export function recordPluginFindings(brandId: string, input: unknown) {
  const body = findingsBody.parse(input);
  db().prepare("UPDATE integrations SET connection_status = 'connected', last_checked_at = ? WHERE brand_id = ? AND provider = 'figma' AND mode = 'mcp'").run(new Date().toISOString(), brandId);
  recordActivity({ brandId: brand(brandId).id, agentName: actor, activityType: "plugin_inspection", status: `${body.findings.length} outdated value(s) in "${body.fileName}"` });
  return { recorded: body.findings.length };
}

const requestBody = z.object({ fileName: z.string().min(1).max(200), changes: z.array(z.object({ property: z.string().max(60), from: z.string().max(60), to: z.string().max(60), count: z.number().int().min(0).max(100000) })).min(1).max(20) });
export function requestPluginApproval(brandId: string, input: unknown) {
  const body = requestBody.parse(input); const b = brand(brandId);
  const owner = db().prepare("SELECT user_id FROM memberships WHERE brand_id = ? AND role = 'owner' LIMIT 1").get(b.id) as { user_id: string } | undefined;
  const provider = db().prepare("SELECT id FROM integrations WHERE brand_id = ? AND provider = 'figma'").get(b.id) as { id: string } | undefined;
  const externalId = `figma-plugin:${body.fileName}`;
  let resource = db().prepare("SELECT id FROM resources WHERE brand_id = ? AND external_resource_id = ?").get(b.id, externalId) as { id: string } | undefined;
  if (!resource) { resource = { id: randomUUID() }; db().prepare(`INSERT INTO resources (id, brand_id, integration_id, resource_type, external_resource_id, resource_name, resource_url, last_inspected_at, status, created_at) VALUES (?, ?, ?, 'figma_file', ?, ?, NULL, ?, 'audited', ?)`).run(resource.id, b.id, provider?.id ?? null, externalId, body.fileName, new Date().toISOString(), new Date().toISOString()); }
  let task = db().prepare("SELECT id, status FROM tasks WHERE brand_id = ? AND status IN ('PLAN_READY','AWAITING_APPROVAL') ORDER BY created_at DESC LIMIT 1").get(b.id) as { id: string; status: string } | undefined;
  if (!task) {
    const created = createTask({ brandId: b.id, initiatedBy: owner?.user_id ?? "", type: "figma_plugin_correction", description: `Apply approved brand values in Figma file "${body.fileName}"`, idempotencyKey: `plugin-${resource.id}-${Date.now()}`, agentName: actor }).task;
    addTaskResource(created.id, resource.id); transitionTask(created.id, "ASSESSING", actor); transitionTask(created.id, "AUDITING", actor); transitionTask(created.id, "PLAN_READY", actor); task = { id: created.id, status: "PLAN_READY" };
  } else addTaskResource(task.id, resource.id);
  const approvalId = requestApproval(task.id, owner?.user_id ?? "", { resourceId: resource.id, operation: PLUGIN_OPERATION, payload: { fileName: body.fileName, changes: body.changes } }, actor);
  if (task.status === "PLAN_READY") transitionTask(task.id, "AWAITING_APPROVAL", actor);
  return { approvalId, status: "pending", where: "Ask the workspace owner to approve this in the Markpath dashboard under Issues & approvals." };
}

export function approvedPluginOperations(brandId: string) {
  const rows = db().prepare(`SELECT a.id, a.approved_action FROM approvals a JOIN tasks t ON t.id = a.task_id WHERE t.brand_id = ? AND a.decision = 'approved' AND a.consumed_at IS NULL ORDER BY a.created_at`).all(brand(brandId).id) as Array<{ id: string; approved_action: string }>;
  return { operations: rows.map((r) => ({ approvalId: r.id, ...(JSON.parse(r.approved_action) as { operation: string; payload: unknown }) })).filter((o) => o.operation === PLUGIN_OPERATION) };
}

const executionBody = z.object({ approvalId: z.string().uuid(), before: z.record(z.string(), z.number()), after: z.record(z.string(), z.number()), reinspected: z.boolean(), remainingOutdated: z.number().int().min(0), via: z.enum(["plugin", "mcp"]).default("plugin") });
export function recordPluginExecution(brandId: string, input: unknown) {
  const body = executionBody.parse(input);
  const row = db().prepare("SELECT a.task_id, a.resource_id, a.approved_action, a.decision, a.consumed_at FROM approvals a JOIN tasks t ON t.id = a.task_id WHERE a.id = ? AND t.brand_id = ?").get(body.approvalId, brandId) as { task_id: string; resource_id: string; approved_action: string; decision: string; consumed_at: string | null } | undefined;
  if (!row || row.decision !== "approved" || row.consumed_at || (JSON.parse(row.approved_action) as { operation: string }).operation !== PLUGIN_OPERATION) throw new PluginApiError("No unused approved plugin operation matches this id.", 409);
  const evidence = { label: body.via === "mcp" ? "applied by the Design agent through the Figma MCP and reported to Markpath; verified separately by Brand QA" : "reported by the Figma plugin; not independently verified by Markpath QA", approvalId: body.approvalId, before: body.before, after: body.after, reinspectedInFigma: body.reinspected, remainingOutdated: body.remainingOutdated };
  db().prepare(`INSERT INTO execution_records (id, task_id, resource_id, operation, result, evidence, mode, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), row.task_id, row.resource_id, PLUGIN_OPERATION, body.remainingOutdated === 0 ? "applied_reported" : "applied_partial_reported", JSON.stringify(evidence), body.via === "mcp" ? "figma_mcp" : "figma_plugin", new Date().toISOString());
  consumeApproval(body.approvalId);
  const t = db().prepare("SELECT brand_id FROM tasks WHERE id = ?").get(row.task_id) as { brand_id: string };
  recordActivity({ brandId: t.brand_id, taskId: row.task_id, agentName: actor, activityType: "plugin_execution", status: body.remainingOutdated === 0 ? "applied, re-inspected in Figma" : `partially applied, ${body.remainingOutdated} outdated remain` });
  return { recorded: true, evidence };
}
