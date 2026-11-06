import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getOrIssueTokens, issueTokens } from "./service";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

const agentRoles = ["director", "design", "implementation", "qa"] as const;
/** Builds the Switch Console template for one workspace. Re-uses the workspace's current agent keys so existing agents keep working; pass rotate to issue new ones (old agents stop working). */
export async function buildRoomTemplate(brandId: string, baseUrl: string, options: { rotate?: boolean } = {}) {
  const { tokens, rotated } = options.rotate ? { tokens: issueTokens(brandId, agentRoles), rotated: true } : getOrIssueTokens(brandId, agentRoles);
  let yaml = await readFile(join(process.cwd(), "switch", "markpath-ops.template.yaml"), "utf8");
  // Switch Console does not substitute {team} inside agent instructions, so the workspace's prefix is written in literally and the unused team parameter is removed.
  const database = getDatabase(); initializeSchema(database);
  const team = (database.prepare("SELECT team_prefix FROM brands WHERE id = ?").get(brandId) as { team_prefix: string } | undefined)?.team_prefix ?? "markpath";
  yaml = yaml.replace(/  team:\n(?:    .*\n)+(?=  provider:)/, "").replaceAll("{team}", team);
  yaml = yaml.replaceAll("MARKPATH_BASE_URL", baseUrl.replace(/\/$/, ""));
  for (const [role, token] of Object.entries(tokens)) yaml = yaml.replaceAll(`MARKPATH_TOKEN_${role.toUpperCase()}`, token);
  return { yaml, rotated };
}
