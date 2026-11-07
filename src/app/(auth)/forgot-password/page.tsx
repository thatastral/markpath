import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset your password" };
export default function ForgotPasswordPage() {
  return <AuthFrame description="Enter your email and we'll send you a link to choose a new password." footer={<>Remembered it? <Link className="font-medium text-ink hover:text-brand" href="/login">Sign in</Link></>} title="Reset your password"><ForgotForm /></AuthFrame>;
}
