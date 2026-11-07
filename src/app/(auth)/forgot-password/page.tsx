import { AuthFrame } from "@/components/auth-frame";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset your password" };
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return <AuthFrame description="Enter your email and we'll send you a link to choose a new password." title="Reset your password"><ForgotForm defaultEmail={email.slice(0, 320)} /></AuthFrame>;
}
