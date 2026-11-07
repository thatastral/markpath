import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return <AuthFrame description="Next, you'll set up a workspace for your brand." footer={<>Already have an account? <Link className="font-medium text-ink hover:text-brand" href="/login">Sign in</Link></>} title="Create your account"><SignupForm /></AuthFrame>;
}
