import { timingSafeEqual } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { verifyToken } from "@/server/tokens/service";

export const agentRoles = ["director", "design", "implementation", "qa"] as const;
export type AgentRole = (typeof agentRoles)[number];
export type AgentPrincipal = { role: AgentRole; brandId: string };
export const agentDisplayName: Record<AgentRole, string> = { director: "Brand Director", design: "Design Agent", implementation: "Implementation Agent", qa: "Brand QA" };

const legacyVariable: Record<AgentRole, string> = { director: "MARKPATH_AGENT_TOKEN_DIRECTOR", design: "MARKPATH_AGENT_TOKEN_DESIGN", implementation: "MARKPATH_AGENT_TOKEN_IMPLEMENTATION", qa: "MARKPATH_AGENT_TOKEN_QA" };
function safeEqual(a: string, b: string) { return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function firstBrandId() { const db = getDatabase(); initializeSchema(db); return (db.prepare("SELECT id FROM brands ORDER BY created_at LIMIT 1").get() as { id: string } | undefined)?.id ?? null; }

/** Resolves a bearer token to the agent role AND the workspace it belongs to. Env tokens are a single-workspace developer fallback. */
export function authenticateAgent(header: string | null): AgentPrincipal | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (!token) return null;
  const issued = verifyToken(token);
  if (issued && issued.role !== "plugin") return { role: issued.role, brandId: issued.brandId };
  for (const role of agentRoles) {
    const expected = process.env[legacyVariable[role]];
    if (expected && safeEqual(token, expected)) { const brandId = firstBrandId(); return brandId ? { role, brandId } : null; }
  }
  const legacy = process.env.MARKPATH_AGENT_TOKEN;
  if (legacy && safeEqual(token, legacy)) { const brandId = firstBrandId(); return brandId ? { role: "director", brandId } : null; }
  return null;
}
export function hasValidAgentToken(header: string | null) { return authenticateAgent(header) !== null; }
