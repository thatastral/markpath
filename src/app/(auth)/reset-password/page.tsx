import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { buttonClass } from "@/components/ui/primitives";
import { resetTokenValid } from "@/server/auth/reset";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Choose a new password" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (!token || !resetTokenValid(token)) return <AuthFrame description="Reset links work once, for 30 minutes." title="This link has expired"><Link className={buttonClass("primary", "md", "mt-6 w-full")} href="/forgot-password">Send a new link</Link></AuthFrame>;
  return <AuthFrame description="You'll be signed in, and signed out everywhere else." title="Choose a new password"><ResetForm token={token} /></AuthFrame>;
}
