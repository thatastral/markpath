import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "markpath_session";
const secret = () => process.env.MARKPATH_SESSION_SECRET ?? "development-only-markpath-secret-change-me";

function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function createSessionValue(userId: string) { return `${userId}.${sign(userId)}`; }
export function readSessionValue(value: string | undefined) {
  if (!value) return null;
  const [userId, signature] = value.split(".");
  if (!userId || !signature) return null;
  const expected = sign(userId);
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return valid ? userId : null;
}

export async function currentUserId() {
  return readSessionValue((await cookies()).get(cookieName)?.value);
}

export async function startSession(userId: string) {
  (await cookies()).set(cookieName, createSessionValue(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}

export async function endSession() { (await cookies()).delete(cookieName); }
