import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserByEmail } from "@/server/db/repositories";

const ttlMinutes = 30;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(256);

export function mailerConfigured() { return Boolean(process.env.RESEND_API_KEY && process.env.MARKPATH_MAIL_FROM); }

async function sendResetEmail(to: string, name: string, link: string) {
  const text = `Hi ${name.split(" ")[0] || "there"},\n\nSomeone asked to reset your Markpath password. Open this link within ${ttlMinutes} minutes to choose a new one:\n\n${link}\n\nIf it wasn't you, ignore this email. Your password stays the same.`;
  if (!mailerConfigured()) {
    if (process.env.NODE_ENV !== "production") console.info(`[markpath] password reset link for ${to}: ${link}`); // local development: no email provider
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.MARKPATH_MAIL_FROM, to, subject: "Reset your Markpath password", text }) });
  if (!res.ok) throw new Error("The reset email couldn't be sent. Try again in a minute.");
  return true;
}

/** Always answers the same way, so nobody can find out which emails have accounts. At most 3 links per hour per account. */
export async function requestPasswordReset(email: string, origin: string) {
  const parsed = z.string().email().max(320).safeParse(email.trim().toLowerCase());
  if (!parsed.success) return { ok: false as const, error: "Enter the email you signed up with." };
  const db = getDatabase(); initializeSchema(db);
  const user = findUserByEmail(db, parsed.data);
  if (!user) return { ok: true as const };
  const recent = (db.prepare("SELECT COUNT(*) AS n FROM password_resets WHERE user_id = ? AND created_at > ?").get(user.id, new Date(Date.now() - 3600_000).toISOString()) as { n: number }).n;
  if (recent >= 3) return { ok: true as const };
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), user.id, hashToken(token), new Date(Date.now() + ttlMinutes * 60_000).toISOString(), new Date().toISOString());
  await sendResetEmail(user.email, user.name, `${origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`);
  return { ok: true as const };
}

export function resetTokenValid(token: string) {
  const db = getDatabase(); initializeSchema(db);
  return Boolean(db.prepare("SELECT 1 FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?").get(hashToken(token), new Date().toISOString()));
}

/** Sets the new password, uses the link up, and signs out every existing session for that account. */
export async function resetPassword(token: string, password: string) {
  const parsed = passwordSchema.safeParse(password); if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const db = getDatabase(); initializeSchema(db);
  const row = db.prepare("SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?").get(hashToken(token), new Date().toISOString()) as { id: string; user_id: string } | undefined;
  if (!row) return { ok: false as const, error: "This link has expired or was already used. Ask for a new one." };
  const hash = await bcrypt.hash(parsed.data, 12); const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?").run(hash, now, row.user_id);
    db.prepare("UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL").run(now, row.user_id);
  })();
  return { ok: true as const, userId: row.user_id };
}

/** Sessions issued before the last password change are no longer valid. */
export function sessionStillValid(userId: string, issuedAtMs: number) {
  const db = getDatabase(); initializeSchema(db);
  const changed = (db.prepare("SELECT password_changed_at FROM users WHERE id = ?").get(userId) as { password_changed_at: string | null } | undefined)?.password_changed_at;
  return !changed || issuedAtMs >= Date.parse(changed) - 1000;
}
