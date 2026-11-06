"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startSession } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { createUser, findUserByEmail } from "@/server/db/repositories";

export type SignupState = { error?: string };
const input = z.object({ name: z.string().trim().min(1, "Enter your name.").max(100), email: z.string().trim().email("Enter a valid email.").max(320).transform((v) => v.toLowerCase()), password: z.string().min(8, "Use at least 8 characters.").max(256) });

export async function signup(_: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = input.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const db = getDatabase(); initializeSchema(db);
  if (findUserByEmail(db, parsed.data.email)) return { error: "An account with that email already exists. Sign in instead." };
  const user = createUser(db, { email: parsed.data.email, name: parsed.data.name, password_hash: await bcrypt.hash(parsed.data.password, 12) });
  await startSession(user.id);
  redirect("/workspaces/new");
}
