import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { consumeApproval, isApprovedOperation, type ProposedOperation } from "@/server/tasks/service";

const now = () => new Date().toISOString();
const fixtureRoot = () => process.env.MARKPATH_FIXTURE_WORKSPACE ?? (process.env.VERCEL ? "/tmp/markpath/fixture-workspaces" : join(process.cwd(), "data", "fixture-workspaces"));
function command(command: string, args: string[], cwd: string) { return execFileSync(command, args, { cwd, encoding: "utf8" }).trim(); }
function record(input: { taskId: string; resourceId: string; operation: string; evidence: Record<string, unknown> }) {
  const db = getDatabase(); initializeSchema(db);
  db.prepare(`INSERT INTO execution_records (id, task_id, resource_id, operation, result, evidence, mode, executed_at)
    VALUES (?, ?, ?, ?, 'succeeded', ?, 'fixture', ?)`)
    .run(randomUUID(), input.taskId, input.resourceId, input.operation, JSON.stringify(input.evidence), now());
}
function requireApproval(taskId: string, operation: ProposedOperation) {
  const approvalId = isApprovedOperation(taskId, operation);
  if (!approvalId) throw new Error("Refused: this exact resource operation does not have an approved approval record.");
  return approvalId;
}
const rootFor = (key?: string) => (key ? join(fixtureRoot(), key) : fixtureRoot());
async function ensureWebRepository(key?: string) {
  const destination = join(rootFor(key), "nexa-web");
  if (!existsSync(destination)) {
    await mkdir(rootFor(key), { recursive: true });
    await cp(join(process.cwd(), "fixtures", "nexa-web"), destination, { recursive: true });
    command("git", ["init", "-b", "main"], destination);
    command("git", ["add", "."], destination);
    command("git", ["-c", "user.name=Markpath Fixture", "-c", "user.email=fixture@markpath.local", "commit", "-m", "chore: seed Nexa fixture"], destination);
  }
  return destination;
}

export async function executeGithubFixture(input: { taskId: string; resourceId: string; operation: ProposedOperation; workspaceKey?: string }) {
  const approvalId = requireApproval(input.taskId, input.operation);
  const repository = await ensureWebRepository(input.workspaceKey); const branch = `markpath/${input.taskId.slice(0, 8)}`;
  const currentBranch = command("git", ["branch", "--show-current"], repository);
  if (currentBranch !== branch) { const exists = command("git", ["branch", "--list", branch], repository); command("git", exists ? ["switch", branch] : ["switch", "-c", branch], repository); }
  const tokenPath = join(repository, "src", "styles", "tokens.css"); const before = await readFile(tokenPath, "utf8");
  const after = before.replaceAll("#164B9B", "#2457F5")
    .replace(/(--font-primary:\s*)Inter\b/g, (_match, prefix: string) => `${prefix}Geist`)
    .replace(/(--radius-button:\s*)4px\b/g, (_match, prefix: string) => `${prefix}8px`);
  if (before === after) throw new Error("Fixture repository already contains the approved values; no simulated change was made.");
  await writeFile(tokenPath, after, "utf8"); command("git", ["add", "src/styles/tokens.css"], repository); command("git", ["-c", "user.name=Markpath Fixture", "-c", "user.email=fixture@markpath.local", "commit", "-m", "fix: apply Nexa brand 2.0 tokens"], repository);
  const commit = command("git", ["rev-parse", "HEAD"], repository); const changed = command("git", ["show", "--format=", "--name-only", "HEAD"], repository).split("\n").filter(Boolean);
  const evidence = { label: "local simulation, not a GitHub PR", approvalId, branch, commit, changedFiles: changed, defaultBranchUntouched: true };
  record({ taskId: input.taskId, resourceId: input.resourceId, operation: input.operation.operation, evidence }); consumeApproval(approvalId); return evidence;
}

export async function executeFigmaFixture(input: { taskId: string; resourceId: string; operation: ProposedOperation; workspaceKey?: string }) {
  const approvalId = requireApproval(input.taskId, input.operation); await mkdir(rootFor(input.workspaceKey), { recursive: true });
  const target = join(rootFor(input.workspaceKey), "nexa-figma.json"); if (!existsSync(target)) await cp(join(process.cwd(), "fixtures", "nexa-figma.json"), target);
  const before = JSON.parse(await readFile(target, "utf8")) as { variables: Array<{ value: string }>; styles: Array<{ fontFamily?: string; radius?: string }> };
  const edited = structuredClone(before); edited.variables.forEach((variable) => { if (variable.value === "#164B9B") variable.value = "#2457F5"; }); edited.styles.forEach((style) => { if (style.fontFamily === "Inter") style.fontFamily = "Geist"; if (style.radius === "4px") style.radius = "8px"; });
  await writeFile(target, JSON.stringify(edited, null, 2), "utf8"); const reread = JSON.parse(await readFile(target, "utf8")) as typeof edited;
  const verified = reread.variables.some((variable) => variable.value === "#2457F5") && reread.styles.some((style) => style.fontFamily === "Geist") && reread.styles.some((style) => style.radius === "8px");
  if (!verified) throw new Error("Fixture Figma verification failed after write.");
  const evidence = { label: "local simulation, not a Figma file", approvalId, path: target, before: { colour: "#164B9B", font: "Inter", radius: "4px" }, after: { colour: "#2457F5", font: "Geist", radius: "8px" }, verified };
  record({ taskId: input.taskId, resourceId: input.resourceId, operation: input.operation.operation, evidence }); consumeApproval(approvalId); return evidence;
}
