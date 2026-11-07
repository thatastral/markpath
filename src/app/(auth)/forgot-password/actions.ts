"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mailerConfigured, requestPasswordReset, resetPassword } from "@/server/auth/reset";
import { startSession } from "@/server/auth/session";

export type ForgotState = { error?: string; sent?: string; email?: string; n?: number; at?: number };
export async function forgotPassword(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "");
  const h = await headers(); const origin = process.env.MARKPATH_PUBLIC_URL?.trim() || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const kept = { email, n: (prev.n ?? 0) + 1 };
  try {
    const result = await requestPasswordReset(email, origin);
    if (!result.ok) return { ...kept, error: result.error };
  } catch (error) { return { ...kept, error: error instanceof Error ? error.message : "Something went wrong. Try again." }; }
  if (!mailerConfigured() && process.env.NODE_ENV === "production") return { ...kept, error: "Password reset email isn't switched on for this Markpath yet. Ask whoever runs it to add an email provider." };
  return { ...kept, sent: email.trim(), at: Date.now() };
}

/** Passwords are never sent back: a mismatch clears both fields and `n` remounts the form. */
export type ResetState = { error?: string; n?: number };
export async function chooseNewPassword(prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? ""); const confirm = String(formData.get("confirm") ?? "");
  const n = (prev.n ?? 0) + 1;
  if (password !== confirm) return { error: "The two passwords don't match. Type them again.", n };
  const result = await resetPassword(String(formData.get("token") ?? ""), password);
  if (!result.ok) return { error: result.error, n };
  await startSession(result.userId);
  // The token is used up now, so the confirmation lives on its own URL (a refresh must not show "expired").
  redirect("/reset-password?done=1");
}
