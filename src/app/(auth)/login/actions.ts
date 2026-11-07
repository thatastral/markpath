"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/server/auth/service";
import { startSession } from "@/server/auth/session";

/** `email` comes back so the form can keep it after a failed attempt. The password never does. `n` remounts the form. */
export type LoginState = { error?: string; email?: string; n?: number };

export async function login(prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const result = await authenticate({ email: formData.get("email"), password: formData.get("password") });
  if (!result.ok) return { error: result.error, email, n: (prev.n ?? 0) + 1 };
  await startSession(result.user.id);
  redirect("/");
}
