"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mailerConfigured, requestPasswordReset, resetPassword } from "@/server/auth/reset";
import { startSession } from "@/server/auth/session";

export type ForgotState = { error?: string; sent?: string };
export async function forgotPassword(_: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "");
  const h = await headers(); const origin = process.env.MARKPATH_PUBLIC_URL?.trim() || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  try {
    const result = await requestPasswordReset(email, origin);
    if (!result.ok) return { error: result.error };
  } catch (error) { return { error: error instanceof Error ? error.message : "Something went wrong. Try again." }; }
  if (!mailerConfigured() && process.env.NODE_ENV === "production") return { error: "Password reset email isn't switched on for this Markpath yet. Ask whoever runs it to add an email provider." };
  return { sent: email.trim() };
}

export type ResetState = { error?: string };
export async function chooseNewPassword(_: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? ""); const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { error: "The two passwords don't match." };
  const result = await resetPassword(String(formData.get("token") ?? ""), password);
  if (!result.ok) return { error: result.error };
  await startSession(result.userId);
  redirect("/");
}
