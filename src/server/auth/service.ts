import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserByEmail } from "@/server/db/repositories";

const credentialsSchema = z.object({ email: z.string().email().max(320).transform((value) => value.toLowerCase()), password: z.string().min(1).max(256) });
export type SignInInput = z.infer<typeof credentialsSchema>;

export async function authenticate(input: unknown) {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid email and password." };
  const db = getDatabase();
  initializeSchema(db);
  const user = findUserByEmail(db, parsed.data.email);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return { ok: false as const, error: "Email or password is incorrect." };
  return { ok: true as const, user };
}
