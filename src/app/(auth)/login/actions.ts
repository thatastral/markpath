"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/server/auth/service";
import { startSession } from "@/server/auth/session";

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const result = await authenticate({ email: formData.get("email"), password: formData.get("password") });
  if (!result.ok) return { error: result.error };
  await startSession(result.user.id);
  redirect("/");
}
