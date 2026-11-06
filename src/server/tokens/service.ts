import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

export const tokenRoles = ["director", "design", "implementation", "qa", "plugin"] as const;
export type TokenRole = (typeof tokenRoles)[number];
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const now = () => new Date().toISOString();
function db() { const database = getDatabase(); initializeSchema(database); return database; }

// Tokens are stored as a hash (for verification) and encrypted (so the room template can be re-issued unchanged).
function encryptionKey() {
  const secret = process.env.MARKPATH_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("MARKPATH_SESSION_SECRET must be set in production.");
  return scryptSync(secret ?? "development-only-markpath-secret-change-me", "markpath-api-tokens", 32);
}
function encrypt(plain: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64")).join(".");
}
function decrypt(stored: string) {
  try {
    const [iv, tag, body] = stored.split(".").map((part) => Buffer.from(part, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv); decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch { return null; }
}

/** Rotates: issues a fresh token per role and revokes the previous ones. Existing agents stop working until given the new tokens. */
export function issueTokens(brandId: string, roles: readonly TokenRole[] = tokenRoles) {
  const database = db(); const issued = {} as Record<TokenRole, string>;
  database.transaction(() => {
    for (const role of roles) {
      database.prepare("UPDATE api_tokens SET revoked_at = ? WHERE brand_id = ? AND role = ? AND revoked_at IS NULL").run(now(), brandId, role);
      const token = `mp_${randomBytes(24).toString("hex")}`;
      database.prepare("INSERT INTO api_tokens (id, brand_id, role, token_hash, token_enc, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), brandId, role, hash(token), encrypt(token), now());
      issued[role] = token;
    }
  })();
  return issued;
}

/** Returns the workspace's current tokens unchanged; issues new ones only if any role has no recoverable active token. */
export function getOrIssueTokens(brandId: string, roles: readonly TokenRole[] = tokenRoles) {
  const database = db(); const existing = {} as Record<TokenRole, string>;
  for (const role of roles) {
    const row = database.prepare("SELECT token_enc FROM api_tokens WHERE brand_id = ? AND role = ? AND revoked_at IS NULL AND token_enc IS NOT NULL ORDER BY created_at DESC LIMIT 1").get(brandId, role) as { token_enc: string } | undefined;
    const plain = row ? decrypt(row.token_enc) : null;
    if (!plain) return { tokens: issueTokens(brandId, roles), rotated: true };
    existing[role] = plain;
  }
  return { tokens: existing, rotated: false };
}

export function verifyToken(token: string): { brandId: string; role: TokenRole } | null {
  const row = db().prepare("SELECT brand_id, role FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL").get(hash(token)) as { brand_id: string; role: TokenRole } | undefined;
  return row ? { brandId: row.brand_id, role: row.role } : null;
}
