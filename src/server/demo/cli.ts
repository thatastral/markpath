import { completeDemoWorkflow, resetDemoWorkflow } from "./workflow";

const command = process.argv[2];
if (command === "reset") {
  const stage = process.argv.includes("--agents") ? "agents" : "approvals";
  resetDemoWorkflow({ stage }).then((result) => console.log(stage === "agents"
    ? `Reset ${result.brand} with an approved brand spec and two fixture resources. No task exists: ask @markpath-director in the Switch room to run the audit.`
    : `Staged ${result.findings} findings and ${result.approvals} pending approvals for ${result.brand}. Task: ${result.taskId}`));
} else if (command === "complete") {
  completeDemoWorkflow().then((result) => console.log(`Demo task ${result.taskId} finished as ${result.status}.`));
} else {
  console.error("Use: tsx src/server/demo/cli.ts <reset|complete>"); process.exitCode = 1;
}
