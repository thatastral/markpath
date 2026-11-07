import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { buttonClass } from "@/components/ui/primitives";
import { resetTokenValid } from "@/server/auth/reset";
import { PasswordChanged, ResetForm } from "./reset-form";

export const metadata = { title: "Choose a new password" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token = "", done } = await searchParams;
  if (done) return <AuthFrame title="Password changed"><PasswordChanged /></AuthFrame>;
  if (!token || !resetTokenValid(token)) return <AuthFrame description="Reset links work once, for 30 minutes." title="This link has expired"><Link className={buttonClass("primary", "md", "mt-6 w-full")} href="/forgot-password">Send a new link</Link></AuthFrame>;
  return <AuthFrame description="You'll be signed in, and signed out everywhere else." title="Choose a new password"><ResetForm token={token} /></AuthFrame>;
}
