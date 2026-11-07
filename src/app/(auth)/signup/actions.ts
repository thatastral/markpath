"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startSession } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { createUser, findUserByEmail } from "@/server/db/repositories";

/** Typed values come back (never the password) so a rejected form keeps them; `field` gets the error and focus; `n` remounts the form. */
export type SignupState = { error?: string; field?: "name" | "email" | "password"; name?: string; email?: string; n?: number };
const input = z.object({ name: z.string().trim().min(1, "Enter your name.").max(100), email: z.string().trim().email("Enter a valid email.").max(320).transform((v) => v.toLowerCase()), password: z.string().min(8, "Use at least 8 characters.").max(256) });

export async function signup(prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = input.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  const kept = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), n: (prev.n ?? 0) + 1 };
  if (!parsed.success) { const issue = parsed.error.issues[0]; return { ...kept, error: issue?.message ?? "Check the details and try again.", field: (issue?.path[0] as SignupState["field"]) ?? undefined }; }
  const db = getDatabase(); initializeSchema(db);
  if (findUserByEmail(db, parsed.data.email)) return { ...kept, error: "That email already has an account. Sign in instead, or use another email.", field: "email" };
  const user = createUser(db, { email: parsed.data.email, name: parsed.data.name, password_hash: await bcrypt.hash(parsed.data.password, 12) });
  await startSession(user.id);
  redirect("/workspaces/new");
}
