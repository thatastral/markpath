import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { verifyToken } from "@/server/tokens/service";
import { figmaMcpConfig } from "@/server/integrations/figma";
import { canvaMcpConfig } from "@/server/integrations/canva";
import { brandJudgementRules, brandValuesFromSpec } from "@/server/brand/spec";
import { ensureDesignResource, replaceDesignFindings } from "@/server/audits/design-findings";
import { consumeApproval, createTask, addTaskResource, recordActivity, requestApproval, transitionTask } from "@/server/tasks/service";

export class PluginApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
export const PLUGIN_OPERATION = "apply_in_figma_plugin";
export const CANVA_OPERATION = "apply_in_canva_mcp";
const providerOf = (operation: string) => (operation === CANVA_OPERATION ? "canva" : "figma");
const actor = "Figma plugin";

/** Returns the workspace a plugin token belongs to, or null. The env token is a single-workspace developer fallback. */
export function pluginPrincipal(header: string | null, allow: string[] = ["plugin", "design"]): { brandId: string } | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7); if (!token) return null;
  const issued = verifyToken(token);
  if (issued && allow.includes(issued.role)) return { brandId: issued.brandId };
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
  const values = brandValuesFromSpec(row.specification);
  if (!values) throw new PluginApiError("The brand specification has no approved colour, typeface and radius rules yet.", 409);
  return { brand: b.name, version: row.version, figmaMcp: figmaMcpConfig(b.id), canvaMcp: canvaMcpConfig(b.id), expected: values.expected, legacy: values.legacy, ...brandJudgementRules(row.specification), logoUploaded: Boolean(db().prepare("SELECT 1 FROM brand_assets WHERE brand_id = ? AND kind = 'logo'").get(b.id)) };
}

const findingsBody = z.object({ provider: z.enum(["figma", "canva"]).default("figma"), fileName: z.string().max(200), findings: z.array(z.object({ nodeName: z.string().max(200), property: z.string().max(60), detected: z.string().max(120), expected: z.string().max(160), evidence: z.string().max(300).optional() })).max(500) });
export function recordPluginFindings(brandId: string, input: unknown) {
  const body = findingsBody.parse(input);
  db().prepare("UPDATE integrations SET connection_status = 'connected', last_checked_at = ? WHERE brand_id = ? AND provider = ? AND mode = 'mcp'").run(new Date().toISOString(), brandId, body.provider);
  replaceDesignFindings(brandId, ensureDesignResource(brandId, body.provider, body.fileName), body.findings); // so every issue is itemised on the Issues page
  recordActivity({ brandId: brand(brandId).id, agentName: actor, activityType: "plugin_inspection", status: `${body.findings.length} outdated value(s) in "${body.fileName}"` });
  return { recorded: body.findings.length };
}

const requestBody = z.object({ provider: z.enum(["figma", "canva"]).default("figma"), fileName: z.string().min(1).max(200), changes: z.array(z.object({ property: z.string().max(60), from: z.string().max(60), to: z.string().max(60), count: z.number().int().min(0).max(100000) })).min(1).max(20) });
export function requestPluginApproval(brandId: string, input: unknown) {
  const body = requestBody.parse(input); const b = brand(brandId);
  const owner = db().prepare("SELECT user_id FROM memberships WHERE brand_id = ? AND role = 'owner' LIMIT 1").get(b.id) as { user_id: string } | undefined;
  const isCanva = body.provider === "canva"; const operation = isCanva ? CANVA_OPERATION : PLUGIN_OPERATION;
  const resource = { id: ensureDesignResource(b.id, body.provider, body.fileName) };
  let task = db().prepare("SELECT id, status FROM tasks WHERE brand_id = ? AND status IN ('PLAN_READY','AWAITING_APPROVAL') ORDER BY created_at DESC LIMIT 1").get(b.id) as { id: string; status: string } | undefined;
  if (!task) {
    const created = createTask({ brandId: b.id, initiatedBy: owner?.user_id ?? "", type: isCanva ? "canva_correction" : "figma_plugin_correction", description: `Apply approved brand values in ${isCanva ? "Canva design" : "Figma file"} "${body.fileName}"`, idempotencyKey: `plugin-${resource.id}-${Date.now()}`, agentName: actor }).task;
    addTaskResource(created.id, resource.id); transitionTask(created.id, "ASSESSING", actor); transitionTask(created.id, "AUDITING", actor); transitionTask(created.id, "PLAN_READY", actor); task = { id: created.id, status: "PLAN_READY" };
  } else addTaskResource(task.id, resource.id);
  const approvalId = requestApproval(task.id, owner?.user_id ?? "", { resourceId: resource.id, operation, payload: { provider: body.provider, fileName: body.fileName, changes: body.changes } }, actor);
  if (task.status === "PLAN_READY") transitionTask(task.id, "AWAITING_APPROVAL", actor);
  return { approvalId, taskId: task.id, status: "pending", where: "Ask the workspace owner to approve this in the Markpath dashboard under Issues & approvals." };
}

export function approvedPluginOperations(brandId: string) {
  const rows = db().prepare(`SELECT a.id, a.approved_action FROM approvals a JOIN tasks t ON t.id = a.task_id WHERE t.brand_id = ? AND a.decision = 'approved' AND a.consumed_at IS NULL ORDER BY a.created_at`).all(brand(brandId).id) as Array<{ id: string; approved_action: string }>;
  return { operations: rows.map((r) => ({ approvalId: r.id, ...(JSON.parse(r.approved_action) as { operation: string; payload: unknown }) })).filter((o) => o.operation === PLUGIN_OPERATION || o.operation === CANVA_OPERATION).map((o) => ({ ...o, provider: providerOf(o.operation) })) };
}

const executionBody = z.object({ approvalId: z.string().uuid(), before: z.record(z.string(), z.number()), after: z.record(z.string(), z.number()), reinspected: z.boolean(), remainingOutdated: z.number().int().min(0), via: z.enum(["plugin", "mcp"]).default("plugin") });
export function recordPluginExecution(brandId: string, input: unknown) {
  const body = executionBody.parse(input);
  const row = db().prepare("SELECT a.task_id, a.resource_id, a.approved_action, a.decision, a.consumed_at FROM approvals a JOIN tasks t ON t.id = a.task_id WHERE a.id = ? AND t.brand_id = ?").get(body.approvalId, brandId) as { task_id: string; resource_id: string; approved_action: string; decision: string; consumed_at: string | null } | undefined;
  if (!row || row.decision !== "approved" || row.consumed_at || ![PLUGIN_OPERATION, CANVA_OPERATION].includes((JSON.parse(row.approved_action) as { operation: string }).operation)) throw new PluginApiError("No unused approved plugin operation matches this id.", 409);
  const operation = (JSON.parse(row.approved_action) as { operation: string }).operation; const provider = providerOf(operation); const viaMcp = body.via === "mcp" || provider === "canva";
  const evidence = { label: viaMcp ? `applied by the Design agent through the ${provider === "canva" ? "Canva" : "Figma"} MCP and reported to Markpath; verified separately by Brand QA` : "reported by the Figma plugin; not independently verified by Markpath QA", approvalId: body.approvalId, before: body.before, after: body.after, reinspected: body.reinspected, remainingOutdated: body.remainingOutdated };
  db().prepare(`INSERT INTO execution_records (id, task_id, resource_id, operation, result, evidence, mode, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), row.task_id, row.resource_id, operation, body.remainingOutdated === 0 ? "applied_reported" : "applied_partial_reported", JSON.stringify(evidence), provider === "canva" ? "canva_mcp" : viaMcp ? "figma_mcp" : "figma_plugin", new Date().toISOString());
  consumeApproval(body.approvalId);
  // A task with only design resources has no GitHub step to move it forward, so executing the approved design edit does.
  const taskNow = db().prepare("SELECT status FROM tasks WHERE id = ?").get(row.task_id) as { status: string };
  const stillPending = (db().prepare("SELECT COUNT(*) AS n FROM approvals WHERE task_id = ? AND decision = 'pending'").get(row.task_id) as { n: number }).n;
  if (taskNow.status === "AWAITING_APPROVAL" && stillPending === 0) { transitionTask(row.task_id, "APPROVED", "Brand Director"); transitionTask(row.task_id, "IMPLEMENTING", actor); }
  else if (taskNow.status === "APPROVED") transitionTask(row.task_id, "IMPLEMENTING", actor);
  const t = db().prepare("SELECT brand_id FROM tasks WHERE id = ?").get(row.task_id) as { brand_id: string };
  recordActivity({ brandId: t.brand_id, taskId: row.task_id, agentName: actor, activityType: "plugin_execution", status: body.remainingOutdated === 0 ? `applied, re-inspected in ${provider === "canva" ? "Canva" : "Figma"}` : `partially applied, ${body.remainingOutdated} outdated remain` });
  return { recorded: true, evidence };
}
