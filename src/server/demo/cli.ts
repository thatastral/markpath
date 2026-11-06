import { completeDemoWorkflow, resetDemoWorkflow } from "./workflow";

const command = process.argv[2];
if (command === "reset") {
  resetDemoWorkflow().then((result) => console.log(`Staged ${result.findings} findings and ${result.approvals} pending approvals for ${result.brand}. Task: ${result.taskId}`));
} else if (command === "complete") {
  completeDemoWorkflow().then((result) => console.log(`Demo task ${result.taskId} finished as ${result.status}.`));
} else {
  console.error("Use: tsx src/server/demo/cli.ts <reset|complete>"); process.exitCode = 1;
}
