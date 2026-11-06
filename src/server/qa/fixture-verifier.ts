import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

const workspace = () => process.env.MARKPATH_FIXTURE_WORKSPACE ?? join(process.cwd(), "data", "fixture-workspaces");
function git(args: string[], cwd: string) { return execFileSync("git", args, { cwd, encoding: "utf8" }).trim(); }
function save(taskId: string, resourceId: string, operation: string, evidence: Record<string, unknown>) { const db = getDatabase(); initializeSchema(db); db.prepare(`INSERT INTO execution_records (id, task_id, resource_id, operation, result, evidence, mode, executed_at) VALUES (?, ?, ?, ?, ?, ?, 'fixture', ?)`)
  .run(randomUUID(), taskId, resourceId, operation, evidence.verified ? "verified" : "failed_verification", JSON.stringify(evidence), new Date().toISOString()); }

export async function verifyGithubFixture(input: { taskId: string; resourceId: string; branch: string }) {
  const repository = join(workspace(), "nexa-web"); const tokenPath = join(repository, "src", "styles", "tokens.css"); const content = await readFile(tokenPath, "utf8");
  const changedFiles = git(["diff", "--name-only", "main...HEAD"], repository).split("\n").filter(Boolean);
  const verified = content.includes("#2457F5") && content.includes("Geist") && content.includes("8px") && !content.includes("#164B9B") && !content.includes("Inter") && !content.includes("4px") && changedFiles.every((file) => file === "src/styles/tokens.css");
  const evidence = { verified, label: "independent local fixture verification", branch: input.branch, changedFiles, expectedPresent: ["#2457F5", "Geist", "8px"], legacyAbsent: ["#164B9B", "Inter", "4px"] }; save(input.taskId, input.resourceId, "verify_github_fixture", evidence); return evidence;
}

export async function verifyFigmaFixture(input: { taskId: string; resourceId: string }) {
  const snapshot = JSON.parse(await readFile(join(workspace(), "nexa-figma.json"), "utf8")) as { variables: Array<{ value: string }>; styles: Array<{ fontFamily?: string; radius?: string }> };
  const values = JSON.stringify(snapshot); const verified = values.includes("#2457F5") && values.includes("Geist") && values.includes("8px") && !values.includes("#164B9B") && !values.includes("Inter") && !values.includes("4px");
  const evidence = { verified, label: "independent local fixture verification", expectedPresent: ["#2457F5", "Geist", "8px"], legacyAbsent: ["#164B9B", "Inter", "4px"] }; save(input.taskId, input.resourceId, "verify_figma_fixture", evidence); return evidence;
}
