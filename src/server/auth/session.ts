import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "markpath_session";
const maxAgeSeconds = 60 * 60 * 12;
const developmentSecret = "development-only-markpath-secret-change-me";

function secret() {
  const configured = process.env.MARKPATH_SESSION_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("MARKPATH_SESSION_SECRET must be set in production.");
  return developmentSecret;
}

function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function createSessionValue(userId: string, issuedAt = Date.now()) {
  const payload = `${userId}.${issuedAt + maxAgeSeconds * 1000}`;
  return `${payload}.${sign(payload)}`;
}
export function readSessionValue(value: string | undefined, nowMs = Date.now()) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, signature] = parts;
  if (!userId || !expiry || !signature) return null;
  const expected = sign(`${userId}.${expiry}`);
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid || !(Number(expiry) > nowMs)) return null;
  return userId;
}

export async function currentUserId() {
  return readSessionValue((await cookies()).get(cookieName)?.value);
}

export async function startSession(userId: string) {
  (await cookies()).set(cookieName, createSessionValue(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: maxAgeSeconds });
}

export async function endSession() { (await cookies()).delete(cookieName); }
