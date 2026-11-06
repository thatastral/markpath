// Generates one random token per Markpath agent. Writes them to .env.local (for the Markpath server) and to
// ~/.markpath/agent-token-<role> (mode 600, for the agents). Tokens are never printed.
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const roles = ["director", "design", "implementation", "qa"];
const envPath = join(process.cwd(), ".env.local");
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const dir = join(homedir(), ".markpath"); mkdirSync(dir, { recursive: true, mode: 0o700 });
for (const role of roles) {
  const key = `MARKPATH_AGENT_TOKEN_${role.toUpperCase()}`;
  const token = randomBytes(24).toString("hex");
  env = env.split("\n").filter((line) => !line.startsWith(`${key}=`)).join("\n");
  env = `${env.replace(/\n*$/, "\n")}${key}=${token}\n`;
  const file = join(dir, `agent-token-${role}`); writeFileSync(file, token, { mode: 0o600 }); chmodSync(file, 0o600);
}
{
  const token = randomBytes(24).toString("hex");
  env = env.split("\n").filter((line) => !line.startsWith("MARKPATH_PLUGIN_TOKEN=")).join("\n");
  env = `${env.replace(/\n*$/, "\n")}MARKPATH_PLUGIN_TOKEN=${token}\n`;
  const file = join(dir, "plugin-token"); writeFileSync(file, token, { mode: 0o600 }); chmodSync(file, 0o600);
}
writeFileSync(envPath, env);
console.log(`Wrote 4 agent tokens and a Figma plugin token to .env.local and ${dir}. Restart the dev server to load them.`);
