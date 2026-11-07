import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { scanFigmaFixture } from "@/server/audits/figma-fixture";
import { scanGithubFixture } from "@/server/audits/github-fixture";
import { createResource, figmaOperation, githubOperation, persistFindings } from "@/server/demo/workflow";
import { executeFigmaFixture, executeGithubFixture } from "@/server/executors/fixture-executors";
import { verifyFigmaFixture, verifyGithubFixture } from "@/server/qa/fixture-verifier";
import { addTaskResource, createTask, finishVerification, recordActivity, requestApproval, transitionTask, updateTaskResource } from "@/server/tasks/service";
import { executeGithubReal, isRealGithub, realGithubResourceId, scanGithubRepo, verifyGithubReal } from "@/server/integrations/github";
import { figmaMcpConfig } from "@/server/integrations/figma";
import { canvaMcpConfig } from "@/server/integrations/canva";
import { brandValuesFromSpec } from "@/server/brand/spec";
import { playbook } from "./playbooks";
import { agentDisplayName, type AgentPrincipal, type AgentRole } from "./auth";

export class AgentApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
type Ctx = AgentPrincipal;
type Target = "github" | "figma";
const externalId: Record<Target, string> = { github: "nexa-web", figma: "nexa-figma" };
const terminal = ["COMPLETED", "PARTIALLY_COMPLETED", "FAILED", "REJECTED"];

function db() { const database = getDatabase(); initializeSchema(database); return database; }
export function requireRole(role: AgentRole, allowed: AgentRole[], action: string) {
  if (!allowed.includes(role)) throw new AgentApiError(`${agentDisplayName[role]} is not allowed to ${action}. Allowed: ${allowed.map((r) => agentDisplayName[r]).join(", ")}.`, 403);
}

function brandFor(brandId: string) {
  const row = db().prepare("SELECT id, name FROM brands WHERE id = ?").get(brandId);
  if (!row) throw new AgentApiError("Brand not found.", 404);
  return row as { id: string; name: string };
}
function taskRow(taskId: string, brandId: string) {
  const row = db().prepare("SELECT id, brand_id, status, description, approval_status FROM tasks WHERE id = ? AND brand_id = ?").get(taskId, brandId) as { id: string; brand_id: string; status: string; description: string; approval_status: string } | undefined;
  if (!row) throw new AgentApiError("Task not found.", 404);
  return row;
}
function resourceFor(brandId: string, target: Target) {
  if (target === "github") { const real = realGithubResourceId(brandId); if (real) return real; }
  const row = db().prepare("SELECT id FROM resources WHERE brand_id = ? AND external_resource_id = ?").get(brandId, externalId[target]) as { id: string } | undefined;
  return row?.id ?? null;
}
function operationFor(target: Target, resourceId: string) { return target === "github" ? githubOperation(resourceId) : figmaOperation(resourceId); }

export async function runAudit(ctx: Ctx, _input: object = {}) {
  const role = ctx.role; requireRole(role, ["director"], "start an audit");
  const brand = brandFor(ctx.brandId);
  const active = db().prepare("SELECT id, status FROM tasks WHERE brand_id = ? AND status NOT IN ('COMPLETED','PARTIALLY_COMPLETED','FAILED','REJECTED') ORDER BY created_at DESC LIMIT 1").get(brand.id) as { id: string; status: string } | undefined;
  if (active) return { reused: true, ...taskState(ctx, active.id) };
  const spec = db().prepare("SELECT status FROM brand_spec_versions WHERE brand_id = ? AND status = 'approved' LIMIT 1").get(brand.id);
  if (!spec) throw new AgentApiError("The brand specification is not approved yet. Approve it in the dashboard first.", 409);
  const real = isRealGithub(brand.id); const figmaMcp = figmaMcpConfig(brand.id); const canvaMcp = canvaMcpConfig(brand.id);
  const resources = { github: resourceFor(brand.id, "github") ?? createResource(brand.id, "github", "Nexa web fixture", "fixture://nexa-web"), figma: figmaMcp ? null : (resourceFor(brand.id, "figma") ?? createResource(brand.id, "figma", "Nexa Figma fixture", "fixture://nexa-figma")) };
  const [githubFindings, snapshot] = await Promise.all([real ? scanGithubRepo(brand.id).then((r) => r.findings) : scanGithubFixture(join(process.cwd(), "fixtures", "nexa-web")), readFile(join(process.cwd(), "fixtures", "nexa-figma.json"), "utf8")]);
  const figmaFindings = figmaMcp ? [] : scanFigmaFixture(JSON.parse(snapshot));
  const owner = db().prepare("SELECT user_id FROM memberships WHERE brand_id = ? AND role = 'owner' LIMIT 1").get(brand.id) as { user_id: string } | undefined;
  const name = agentDisplayName[role];
  const { task } = createTask({ brandId: brand.id, initiatedBy: owner?.user_id ?? "", type: "brand_correction", description: `Correct ${brand.name} brand values in ${real ? "the connected GitHub repository" : "the fixture repository"} and design`, idempotencyKey: `agent-audit-${brand.id}-${Date.now()}`, agentName: name });
  addTaskResource(task.id, resources.github); if (resources.figma) addTaskResource(task.id, resources.figma);
  transitionTask(task.id, "ASSESSING", name); transitionTask(task.id, "AUDITING", name);
  db().transaction(() => { persistFindings(brand.id, resources.github, githubFindings); if (resources.figma) persistFindings(brand.id, resources.figma, figmaFindings); })();
  transitionTask(task.id, "PLAN_READY", name);
  requestApproval(task.id, owner?.user_id ?? "", githubOperation(resources.github), name); if (resources.figma) requestApproval(task.id, owner?.user_id ?? "", figmaOperation(resources.figma), name);
  // With a Figma file audited through the MCP, the task waits in PLAN_READY until the Design agent adds the Figma approval (or the Director proceeds without it).
  if (!figmaMcp && !canvaMcp) transitionTask(task.id, "AWAITING_APPROVAL", name);
  return { reused: false, newFindingCount: githubFindings.length + figmaFindings.length, ...(figmaMcp ? { figma: { url: figmaMcp.url, fileKey: figmaMcp.fileKey, next: "Ask the Design agent to audit this Figma file for this task through the Figma MCP. It adds the Figma approval; then post the approval request." } } : {}), ...(canvaMcp ? { canva: { url: canvaMcp.url, designId: canvaMcp.designId, next: "Ask the Design agent to audit this Canva design for this task through the Canva MCP. It adds the Canva approval." } } : {}), ...taskState(ctx, task.id) };
}

export function taskState(ctx: Pick<Ctx, "brandId">, taskId: string) {
  const task = taskRow(taskId, ctx.brandId);
  const resources = db().prepare("SELECT r.external_resource_id AS target, r.resource_name AS name, tr.status, tr.error, tr.verification_evidence FROM task_resources tr JOIN resources r ON r.id = tr.resource_id WHERE tr.task_id = ?").all(taskId) as Array<{ target: string; name: string; status: string; error: string | null; verification_evidence: string | null }>;
  const approvals = db().prepare("SELECT a.id, r.external_resource_id AS target, a.decision, a.consumed_at FROM approvals a JOIN resources r ON r.id = a.resource_id WHERE a.task_id = ? ORDER BY r.external_resource_id").all(taskId);
  const executions = db().prepare("SELECT r.external_resource_id AS target, e.operation, e.result, e.mode, e.executed_at, e.evidence FROM execution_records e LEFT JOIN resources r ON r.id = e.resource_id WHERE e.task_id = ? ORDER BY e.executed_at").all(taskId) as Array<{ target: string; operation: string; result: string; mode: string; executed_at: string; evidence: string }>;
  const findings = db().prepare("SELECT i.provider, f.rule_id, f.detected_value, f.expected_value, f.severity, f.classification FROM findings f JOIN resources r ON r.id = f.resource_id LEFT JOIN integrations i ON i.id = r.integration_id WHERE f.brand_id = ? AND f.status = 'open'").all(task.brand_id);
  const pending = (approvals as Array<{ decision: string }>).filter((a) => a.decision === "pending").length;
  return { taskId: task.id, status: task.status, description: task.description, approvalStatus: task.approval_status, pendingApprovals: pending, approvals, findings, resources: resources.map((r) => ({ ...r, verification_evidence: r.verification_evidence ? JSON.parse(r.verification_evidence) : null })), executions: executions.map((e) => ({ ...e, evidence: JSON.parse(e.evidence) })), nextStep: nextStep(task.status, pending) };
}
function nextStep(status: string, pending: number) {
  if (status === "AWAITING_APPROVAL") return pending > 0 ? "A human must approve each pending operation in the Markpath dashboard (Issues and approvals). Agents cannot approve." : "All approvals decided. Implementation and Design agents may execute.";
  if (status === "APPROVED" || status === "IMPLEMENTING") return "Execute both resources, then ask Brand QA to verify.";
  if (status === "VERIFYING") return "Brand QA must finish verification.";
  return terminal.includes(status) ? "Task is finished." : "Continue the workflow.";
}

export async function executeTarget(ctx: Ctx, input: { taskId: string; target: Target }) {
  const role = ctx.role; requireRole(role, [input.target === "github" ? "implementation" : "design"], `execute the ${input.target} operation`);
  const task = taskRow(input.taskId, ctx.brandId); const name = agentDisplayName[role];
  const resourceId = resourceFor(task.brand_id, input.target); if (!resourceId) throw new AgentApiError("Resource not found for this brand.", 404);
  if (task.status === "AWAITING_APPROVAL") {
    const decisions = db().prepare("SELECT decision FROM approvals WHERE task_id = ?").all(task.id) as Array<{ decision: string }>;
    if (decisions.some((d) => d.decision === "pending")) throw new AgentApiError("Refused: approvals are still pending. A human must approve in the dashboard.", 409);
    if (decisions.some((d) => d.decision === "rejected")) { transitionTask(task.id, "REJECTED", name); throw new AgentApiError("A required operation was rejected; the task is REJECTED.", 409); }
    transitionTask(task.id, "APPROVED", "Brand Director");
  }
  const current = taskRow(task.id, ctx.brandId).status;
  if (current === "APPROVED") transitionTask(task.id, "IMPLEMENTING", name);
  else if (current !== "IMPLEMENTING") throw new AgentApiError(`Cannot execute while the task is ${current}.`, 409);
  try {
    const realGithub = input.target === "github" && isRealGithub(ctx.brandId);
    const evidence = input.target === "github" ? (realGithub ? await executeGithubReal({ brandId: ctx.brandId, taskId: task.id, resourceId, operation: operationFor("github", resourceId) }) : await executeGithubFixture({ taskId: task.id, resourceId, operation: operationFor("github", resourceId), workspaceKey: ctx.brandId })) : await executeFigmaFixture({ taskId: task.id, resourceId, operation: operationFor("figma", resourceId), workspaceKey: ctx.brandId });
    recordActivity({ brandId: task.brand_id, taskId: task.id, agentName: name, activityType: `executed_${input.target}`, status: "IMPLEMENTING" });
    return { target: input.target, executed: true, evidence, note: realGithub ? "A real GitHub pull request was opened and not merged. Brand QA must verify independently before the task is complete." : "Executed locally as a fixture simulation. Brand QA must verify independently before the task is complete." };
  } catch (error) { throw new AgentApiError(error instanceof Error ? error.message : "Execution failed.", 409); }
}

export async function verifyTask(ctx: Ctx, input: { taskId: string }) {
  requireRole(ctx.role, ["qa"], "verify a task");
  const task = taskRow(input.taskId, ctx.brandId);
  const records = db().prepare("SELECT r.external_resource_id AS target, r.id AS resource_id, e.evidence FROM execution_records e JOIN resources r ON r.id = e.resource_id WHERE e.task_id = ? AND e.mode IN ('fixture', 'github_real', 'figma_plugin', 'figma_mcp', 'canva_mcp') AND e.result IN ('succeeded', 'applied_reported')").all(task.id) as Array<{ target: string; resource_id: string; evidence: string }>;
  const isGithub = (target: string) => target === "nexa-web" || target.startsWith("gh:");
  const isFigmaFile = (target: string) => target.startsWith("figma-plugin:") || target.startsWith("canva-mcp:"); // a Figma file or Canva design edited through an MCP
  const missing = (["github", "figma"] as Target[]).filter((t) => !records.some((r) => (t === "github" ? isGithub(r.target) : r.target === externalId.figma || isFigmaFile(r.target))));
  if (missing.length) throw new AgentApiError(`Refused: nothing to verify yet for ${missing.join(", ")}. Both resources must be executed first.`, 409);
  // A Figma file edited through the Figma MCP is verified by Brand QA re-reading it there; that report must exist before the task can be finished.
  for (const design of records.filter((r) => isFigmaFile(r.target))) {
    const reported = db().prepare("SELECT status, verification_evidence FROM task_resources WHERE task_id = ? AND resource_id = ?").get(task.id, design.resource_id) as { status: string; verification_evidence: string | null } | undefined;
    if (!reported?.verification_evidence) throw new AgentApiError(`Refused: Brand QA must first re-read ${design.target.split(":")[0] === "canva-mcp" ? "the Canva design" : "the Figma file"} through its MCP and report it with POST /api/agent/figma-verification, then call verify again.`, 409);
  }
  if (task.status === "IMPLEMENTING") transitionTask(task.id, "VERIFYING", "Brand QA");
  else if (task.status !== "VERIFYING") throw new AgentApiError(`Cannot verify while the task is ${task.status}.`, 409);
  const github = records.find((r) => isGithub(r.target))!; const figma = records.find((r) => r.target === "nexa-figma" || isFigmaFile(r.target))!;
  const githubEvidence = JSON.parse(github.evidence) as { branch: string; label?: string; repo: string; baseBranch: string; baseShaBefore: string; pullRequest: { number: number; url: string }; changedFiles: string[] };
  const branch = githubEvidence.branch; const realPull = githubEvidence.label === "real GitHub pull request";
  const [githubReport, figmaReport] = await Promise.all([realPull ? verifyGithubReal({ brandId: ctx.brandId, taskId: task.id, resourceId: github.resource_id, evidence: githubEvidence }) : verifyGithubFixture({ taskId: task.id, resourceId: github.resource_id, branch, workspaceKey: ctx.brandId }), isFigmaFile(figma.target) ? Promise.resolve(JSON.parse((db().prepare("SELECT verification_evidence FROM task_resources WHERE task_id = ? AND resource_id = ?").get(task.id, figma.resource_id) as { verification_evidence: string }).verification_evidence) as { verified: boolean }) : verifyFigmaFixture({ taskId: task.id, resourceId: figma.resource_id, workspaceKey: ctx.brandId })]);
  updateTaskResource({ taskId: task.id, resourceId: github.resource_id, status: githubReport.verified ? "COMPLETED" : "FAILED", verificationEvidence: githubReport, error: githubReport.verified ? undefined : "GitHub QA failed.", actor: "Brand QA" });
  if (!isFigmaFile(figma.target)) updateTaskResource({ taskId: task.id, resourceId: figma.resource_id, status: figmaReport.verified ? "COMPLETED" : "FAILED", verificationEvidence: figmaReport, error: figmaReport.verified ? undefined : "Figma fixture QA failed.", actor: "Brand QA" });
  const finished = finishVerification(task.id);
  return { status: finished.status, github: githubReport, figma: figmaReport, humanFollowUp: realPull ? `Review and merge the pull request yourself: ${githubEvidence.pullRequest.url}` : "Fixture only: there is no real pull request to merge." };
}

export function recordRoomEvent(ctx: Ctx, input: { roomId: string; messageId: string; taskId?: string; note?: string }) {
  if (input.taskId) taskRow(input.taskId, ctx.brandId);
  recordActivity({ brandId: ctx.brandId, taskId: input.taskId ?? null, agentName: agentDisplayName[ctx.role], activityType: "room_message", status: input.note?.slice(0, 80) || "posted in room", messageReference: `${input.roomId}:${input.messageId}` });
  return { recorded: true };
}

export function switchRoomVerified(brandId: string) {
  const row = db().prepare("SELECT COUNT(*) AS n FROM agent_activity WHERE brand_id = ? AND activity_type = 'room_message' AND message_reference IS NOT NULL").get(brandId) as { n: number };
  return row.n > 0;
}

/** The team prefix is owned by the server (brands.team_prefix). Switch leaves {team} unsubstituted in agent instructions, so whatever the agent passes is ignored. */
export function teamPrefixFor(brandId: string) { return (db().prepare("SELECT team_prefix FROM brands WHERE id = ?").get(brandId) as { team_prefix: string } | undefined)?.team_prefix ?? "markpath"; }
export function rolePlaybook(ctx: Ctx, _team: string, base: string) { return { role: ctx.role, team: teamPrefixFor(ctx.brandId), playbook: playbook(ctx.role, teamPrefixFor(ctx.brandId), base) }; }

/** Long-poll: returns as soon as every approval for the task has been decided, or when the timeout passes. */
export async function waitForApprovals(ctx: Ctx, taskId: string, timeoutSeconds: number) {
  taskRow(taskId, ctx.brandId);
  const deadline = Date.now() + Math.min(Math.max(timeoutSeconds, 1), 90) * 1000;
  for (;;) {
    const rows = db().prepare("SELECT decision FROM approvals WHERE task_id = ?").all(taskId) as Array<{ decision: string }>;
    const pending = rows.filter((r) => r.decision === "pending").length;
    if (rows.length > 0 && pending === 0) return { decided: true, approved: rows.filter((r) => r.decision === "approved").length, rejected: rows.filter((r) => r.decision === "rejected").length };
    if (Date.now() >= deadline) return { decided: false, pending, note: "Still waiting for a human to decide in the dashboard. Call again." };
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export const normalizeHandle = (handle: string) => handle.trim().replace(/^@/, "").split(":")[0].toLowerCase();

/** The Director relays a human's chat reply. Markpath accepts it only for a recognised workspace owner, an explicit approve/reject, a pending task and a message not used before. The result is labelled as relayed, not login-verified. */
export function chatApproval(ctx: Ctx, input: { taskId: string; senderHandle: string; roomId: string; messageId: string; quote: string }) {
  requireRole(ctx.role, ["director"], "relay a chat approval");
  const task = taskRow(input.taskId, ctx.brandId);
  const text = input.quote.replace(/^\s*(@\S+\s+)+/, "").trim();
  const decision = /^approv(e|ed|al)\b/i.test(text) ? "approved" : /^(reject|rejected|deny|denied|decline)\b/i.test(text) ? "rejected" : null;
  if (!decision) throw new AgentApiError("That message is not an explicit approve or reject. Ask the person to reply with the word approve or reject, or send them the approval link.", 422);
  // Switch tells an agent only that "a user" addressed it, not who. When the sender is reported with that generic label, the approval is attributed to the
  // workspace owner, but only if the workspace has exactly one owner. Switch's addressing rules (the Director answers the room owner and the owner's agents) are what limit who can reach the Director.
  const genericSender = ["user", "owner", "human"].includes(normalizeHandle(input.senderHandle));
  const owners = db().prepare("SELECT m.user_id, u.name FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.brand_id = ? AND m.role = 'owner'").all(ctx.brandId) as Array<{ user_id: string; name: string }>;
  const identity = genericSender ? (owners.length === 1 ? owners[0] : undefined) : db().prepare("SELECT ci.user_id, u.name FROM chat_identities ci JOIN users u ON u.id = ci.user_id JOIN memberships m ON m.user_id = ci.user_id AND m.brand_id = ci.brand_id WHERE ci.brand_id = ? AND lower(ci.handle) = ? AND m.role = 'owner'").get(ctx.brandId, normalizeHandle(input.senderHandle)) as { user_id: string; name: string } | undefined;
  if (!identity) throw new AgentApiError(`"${input.senderHandle}" is not a recognised workspace owner chat identity, so Markpath will not record this approval. Send them the approval link instead.`, 403);
  if (task.status !== "AWAITING_APPROVAL") throw new AgentApiError(`Task is ${task.status}; there is nothing waiting for approval.`, 409);
  const ref = `${input.roomId}:${input.messageId}`;
  if (db().prepare("SELECT 1 FROM approvals WHERE decision_ref = ?").get(ref)) throw new AgentApiError("That chat message was already used for a decision.", 409);
  const pending = db().prepare("SELECT id FROM approvals WHERE task_id = ? AND decision = 'pending'").all(task.id) as Array<{ id: string }>;
  if (pending.length === 0) throw new AgentApiError("No approvals are pending for this task.", 409);
  db().transaction(() => {
    for (const a of pending) db().prepare("UPDATE approvals SET decision = ?, approved_by = ?, decision_channel = 'chat_relayed', decision_ref = ? WHERE id = ?").run(decision, identity.user_id, ref, a.id);
    db().prepare("UPDATE tasks SET approval_status = ? WHERE id = ?").run(decision, task.id);
  })();
  recordActivity({ brandId: ctx.brandId, taskId: task.id, agentName: `Human: ${identity.name}`, activityType: "approval_decision", status: `${decision.toUpperCase()} (by chat reply, relayed by Brand Director${genericSender ? "; sender reported only as \"user\", attributed to the sole workspace owner" : ""}; not login-verified)`, messageReference: ref });
  return { decision, decidedOperations: pending.length, decidedBy: identity.name, channel: "chat_relayed", next: decision === "approved" ? "Now mention the Design and Implementation agents to execute." : "Report the rejection and stop." };
}

export function readyForApproval(ctx: Ctx, taskId: string) {
  requireRole(ctx.role, ["director"], "move a task to approval");
  const task = taskRow(taskId, ctx.brandId);
  if (task.status === "AWAITING_APPROVAL") return taskState(ctx, taskId);
  if (task.status !== "PLAN_READY") throw new AgentApiError(`Task is ${task.status}; only a ready plan can move to approval.`, 409);
  const pending = (db().prepare("SELECT COUNT(*) AS n FROM approvals WHERE task_id = ? AND decision = 'pending'").get(taskId) as { n: number }).n;
  if (pending === 0) throw new AgentApiError("There is nothing to approve yet.", 409);
  transitionTask(taskId, "AWAITING_APPROVAL", agentDisplayName[ctx.role]);
  return taskState(ctx, taskId);
}

/** QA reports its independent re-read of the Figma file (done through the Figma MCP). Markpath decides pass/fail from the counts; it does not trust a claimed "verified". */
export function figmaVerification(ctx: Ctx, input: { taskId: string; provider?: "figma" | "canva"; counts: Record<string, number>; checkedNodeIds?: string[]; note?: string }) {
  requireRole(ctx.role, ["qa"], "report a design verification");
  const provider = input.provider ?? "figma"; const prefix = provider === "canva" ? "canva-mcp:" : "figma-plugin:";
  const task = taskRow(input.taskId, ctx.brandId);
  const resource = db().prepare("SELECT r.id FROM task_resources tr JOIN resources r ON r.id = tr.resource_id WHERE tr.task_id = ? AND r.external_resource_id LIKE ?").get(task.id, `${prefix}%`) as { id: string } | undefined;
  if (!resource) throw new AgentApiError(`This task has no ${provider === "canva" ? "Canva design" : "Figma file"} edited through the MCP.`, 404);
  const executed = db().prepare("SELECT 1 FROM execution_records WHERE task_id = ? AND resource_id = ? AND mode IN ('figma_mcp', 'figma_plugin', 'canva_mcp')").get(task.id, resource.id);
  if (!executed) throw new AgentApiError("The Design agent has not applied the change yet, so there is nothing to verify.", 409);
  // "humanReview" counts items only a person can resolve (for example a leftover template placeholder). They are reported but do not fail verification.
  const humanReview = input.counts.humanReview ?? 0;
  const remaining = Object.entries(input.counts).filter(([k]) => k !== "humanReview").reduce((sum, [, n]) => sum + n, 0); const verified = remaining === 0;
  const label = `independent re-read of the ${provider === "canva" ? "Canva design" : "Figma file"} by Brand QA through the ${provider === "canva" ? "Canva" : "Figma"} MCP; reported by the agent, not re-checked by Markpath`;
  const evidence = { verified, label, remainingOutdated: remaining, needsHumanReview: humanReview, counts: input.counts, checkedNodeIds: (input.checkedNodeIds ?? []).slice(0, 40), note: input.note?.slice(0, 300) };
  updateTaskResource({ taskId: task.id, resourceId: resource.id, status: verified ? "COMPLETED" : "FAILED", verificationEvidence: evidence, error: verified ? undefined : `${remaining} outdated value(s) remain.`, actor: "Brand QA" });
  return { verified, remainingOutdated: remaining, needsHumanReview: humanReview, next: verified ? "Now call POST /api/agent/verify to verify the other resources and finish the task." : "Do not finish the task; report the remaining outdated values." };
}

/** The read-only inspect script or the approved-change apply script for the Figma MCP, with this workspace's brand values filled in. */
export async function figmaScript(ctx: Ctx, name: "inspect" | "apply") {
  requireRole(ctx.role, name === "inspect" ? ["design", "qa"] : ["design"], `fetch the ${name} script`);
  const row = db().prepare("SELECT brand_specification FROM brands WHERE id = ?").get(ctx.brandId) as { brand_specification: string } | undefined;
  const values = row ? brandValuesFromSpec(row.brand_specification) : null;
  if (!values) throw new AgentApiError("The brand specification has no approved colour, typeface and radius rules yet.", 409);
  const body = await readFile(join(process.cwd(), "src", "server", "agents", "figma-scripts", `${name}.js`), "utf8");
  const config = name === "inspect" ? { legacy: values.legacy } : { from: values.legacy, to: values.expected };
  return { name, instructions: "Pass `code` verbatim as the `code` argument of the Figma MCP use_figma tool, with the fileKey of the file you were given. Do not edit it.", code: `const CONFIG = ${JSON.stringify(config)};\n${body}` };
}
