import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

function key() {
  const secret = process.env.MARKPATH_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("MARKPATH_SESSION_SECRET must be set in production.");
  return scryptSync(secret ?? "development-only-markpath-secret-change-me", "markpath-secrets", 32);
}
export function encryptSecret(plain: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64")).join(".");
}
export function decryptSecret(stored: string): string | null {
  try {
    const [iv, tag, body] = stored.split(".").map((part) => Buffer.from(part, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv); decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch { return null; }
}
