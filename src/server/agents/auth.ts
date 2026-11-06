import { timingSafeEqual } from "node:crypto";

export function hasValidAgentToken(header: string | null) {
  const expected = process.env.MARKPATH_AGENT_TOKEN;
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const token = header.slice(7); return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
