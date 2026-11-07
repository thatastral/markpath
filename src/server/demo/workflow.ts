import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { scanFigmaFixture } from "@/server/audits/figma-fixture";
import { scanGithubFixture } from "@/server/audits/github-fixture";
import type { AuditFinding } from "@/server/audits/types";
import { approveSpec, ingestFixtureGuideline } from "@/server/brand/service";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { seedDatabase } from "@/server/db/seed";
import { executeFigmaFixture, executeGithubFixture } from "@/server/executors/fixture-executors";
import { verifyFigmaFixture, verifyGithubFixture } from "@/server/qa/fixture-verifier";
import { addTaskResource, createTask, finishVerification, requestApproval, transitionTask, updateTaskResource } from "@/server/tasks/service";

const now = () => new Date().toISOString();
export const githubOperation = (resourceId: string) => ({ resourceId, operation: "replace_tokens", payload: { values: "nexa-2.0" } });
export const figmaOperation = (resourceId: string) => ({ resourceId, operation: "replace_values", payload: { values: "nexa-2.0" } });

type DemoResources = { github: string; figma: string };

function integrationId(brandId: string, provider: "github" | "figma") {
  const db = getDatabase();
  const integration = db.prepare("SELECT id FROM integrations WHERE brand_id = ? AND provider = ?").get(brandId, provider) as { id: string } | undefined;
  if (!integration) throw new Error(`Missing seeded ${provider} integration.`);
  return integration.id;
}

export function createResource(brandId: string, provider: "github" | "figma", name: string, url: string) {
  const db = getDatabase(); const id = randomUUID();
  db.prepare(`INSERT INTO resources (id, brand_id, integration_id, resource_type, external_resource_id, resource_name, resource_url, last_inspected_at, status, created_at)
    VALUES (?, ?, ?, 'fixture', ?, ?, ?, ?, 'audited', ?)`).run(id, brandId, integrationId(brandId, provider), provider === "github" ? "nexa-web" : "nexa-figma", name, url, now(), now());
  return id;
}

export function persistFindings(brandId: string, resourceId: string, findings: AuditFinding[]) {
  const db = getDatabase(); const insert = db.prepare(`INSERT INTO findings (id, brand_id, resource_id, rule_id, detected_value, expected_value, severity, confidence, evidence, recommended_action, classification, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`);
  for (const finding of findings) insert.run(randomUUID(), brandId, resourceId, finding.ruleId, finding.detected, finding.expected, finding.severity, finding.confidence, finding.evidence, finding.recommendedAction, finding.classification, now());
}

async function removeDemoWorkingData() {
  const dataRoot = join(process.cwd(), "data");
  await Promise.all([
    rm(join(dataRoot, "fixture-workspaces"), { recursive: true, force: true }),
    rm(join(dataRoot, "uploads"), { recursive: true, force: true }),
  ]);
}

export async function resetDemoWorkflow(options: { stage?: "approvals" | "agents" } = {}) {
  const db = getDatabase(); initializeSchema(db); await removeDemoWorkingData();
  db.transaction(() => {
    // Keeps the user, workspace, memberships, integrations and agent keys so a reset never invalidates agents already running in Switch.
    for (const table of ["agent_activity", "execution_records", "approvals", "task_resources", "findings", "tasks", "resources", "brand_spec_versions", "brand_guidelines"]) db.prepare(`DELETE FROM ${table}`).run();
  })();
  const { user, brand } = await seedDatabase();
  const version = await ingestFixtureGuideline(brand.id, user.id);
  approveSpec(brand.id, user.id, version.id);
  const resources: DemoResources = {
    github: createResource(brand.id, "github", "Nexa web fixture", "fixture://nexa-web"),
    figma: createResource(brand.id, "figma", "Nexa Figma fixture", "fixture://nexa-figma"),
  };
  if (options.stage === "agents") return { brand: brand.name, taskId: "", resources, findings: 0, approvals: 0 };
  const [githubFindings, figmaSnapshot] = await Promise.all([
    scanGithubFixture(join(process.cwd(), "fixtures", "nexa-web")),
    readFile(join(process.cwd(), "fixtures", "nexa-figma.json"), "utf8"),
  ]);
  const figmaFindings = scanFigmaFixture(JSON.parse(figmaSnapshot));
  persistFindings(brand.id, resources.github, githubFindings);
  persistFindings(brand.id, resources.figma, figmaFindings);
  const task = createTask({ brandId: brand.id, initiatedBy: user.id, type: "brand_correction", description: "Correct Nexa 2.0 fixture tokens in code and design", idempotencyKey: "demo-nexa-2.0-correction", agentName: "Brand Director" }).task;
  addTaskResource(task.id, resources.github); addTaskResource(task.id, resources.figma);
  transitionTask(task.id, "ASSESSING", "Brand Director"); transitionTask(task.id, "AUDITING", "Brand Director"); transitionTask(task.id, "PLAN_READY", "Brand Director");
  requestApproval(task.id, user.id, githubOperation(resources.github)); requestApproval(task.id, user.id, figmaOperation(resources.figma)); transitionTask(task.id, "AWAITING_APPROVAL", "Brand Director");
  return { brand: brand.name, taskId: task.id, resources, findings: githubFindings.length + figmaFindings.length, approvals: 2 };
}

function getDemoTask() {
  const db = getDatabase(); initializeSchema(db);
  const task = db.prepare("SELECT id, status FROM tasks WHERE idempotency_key = 'demo-nexa-2.0-correction'").get() as { id: string; status: string } | undefined;
  if (!task) throw new Error("No staged demo workflow. Run npm run demo:reset first.");
  if (task.status !== "AWAITING_APPROVAL") throw new Error(`Demo task is ${task.status}; it can only be completed from AWAITING_APPROVAL.`);
  const approvals = db.prepare("SELECT decision FROM approvals WHERE task_id = ?").all(task.id) as Array<{ decision: string }>;
  if (approvals.length !== 2 || approvals.some((approval) => approval.decision !== "approved")) throw new Error("Both resource-bound approvals must be approved in the dashboard before completion.");
  const resources = db.prepare("SELECT id, external_resource_id FROM resources WHERE brand_id = (SELECT brand_id FROM tasks WHERE id = ?) ORDER BY external_resource_id").all(task.id) as Array<{ id: string; external_resource_id: string }>;
  const github = resources.find((resource) => resource.external_resource_id === "nexa-web")?.id;
  const figma = resources.find((resource) => resource.external_resource_id === "nexa-figma")?.id;
  if (!github || !figma) throw new Error("Staged demo resources are missing.");
  return { taskId: task.id, resources: { github, figma } };
}

export async function completeDemoWorkflow() {
  const demo = getDemoTask();
  transitionTask(demo.taskId, "APPROVED", "Brand Director"); transitionTask(demo.taskId, "IMPLEMENTING", "Implementation Agent");
  const githubResult = await executeGithubFixture({ taskId: demo.taskId, resourceId: demo.resources.github, operation: githubOperation(demo.resources.github) });
  await executeFigmaFixture({ taskId: demo.taskId, resourceId: demo.resources.figma, operation: figmaOperation(demo.resources.figma) });
  transitionTask(demo.taskId, "VERIFYING", "Brand QA");
  const [githubVerification, figmaVerification] = await Promise.all([
    verifyGithubFixture({ taskId: demo.taskId, resourceId: demo.resources.github, branch: githubResult.branch }),
    verifyFigmaFixture({ taskId: demo.taskId, resourceId: demo.resources.figma }),
  ]);
  updateTaskResource({ taskId: demo.taskId, resourceId: demo.resources.github, status: githubVerification.verified ? "COMPLETED" : "FAILED", verificationEvidence: githubVerification, error: githubVerification.verified ? undefined : "GitHub fixture QA failed." });
  updateTaskResource({ taskId: demo.taskId, resourceId: demo.resources.figma, status: figmaVerification.verified ? "COMPLETED" : "FAILED", verificationEvidence: figmaVerification, error: figmaVerification.verified ? undefined : "Figma fixture QA failed." });
  const finished = finishVerification(demo.taskId);
  return { taskId: demo.taskId, status: finished.status, githubVerification, figmaVerification };
}

/** Gives a new "sample brand" workspace something to try straight away: sample code and design issues and a fix waiting for approval. */
export async function stageSampleData(brandId: string, userId: string) {
  const resources: DemoResources = {
    github: createResource(brandId, "github", "Nexa web fixture", "fixture://nexa-web"),
    figma: createResource(brandId, "figma", "Nexa Figma fixture", "fixture://nexa-figma"),
  };
  const [githubFindings, figmaSnapshot] = await Promise.all([scanGithubFixture(join(process.cwd(), "fixtures", "nexa-web")), readFile(join(process.cwd(), "fixtures", "nexa-figma.json"), "utf8")]);
  persistFindings(brandId, resources.github, githubFindings);
  persistFindings(brandId, resources.figma, scanFigmaFixture(JSON.parse(figmaSnapshot)));
  const task = createTask({ brandId, initiatedBy: userId, type: "brand_correction", description: "Fix the sample brand's old colour, typeface and corner radius in code and design", idempotencyKey: `sample-${brandId}`, agentName: "Brand Director" }).task;
  addTaskResource(task.id, resources.github); addTaskResource(task.id, resources.figma);
  transitionTask(task.id, "ASSESSING", "Brand Director"); transitionTask(task.id, "AUDITING", "Brand Director"); transitionTask(task.id, "PLAN_READY", "Brand Director");
  requestApproval(task.id, userId, githubOperation(resources.github)); requestApproval(task.id, userId, figmaOperation(resources.figma)); transitionTask(task.id, "AWAITING_APPROVAL", "Brand Director");
  return task.id;
}
