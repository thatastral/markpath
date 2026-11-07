import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <AuthFrame description={process.env.NODE_ENV !== "production" ? "Trying the demo? Sign in with demo@markpath.local and markpath-demo." : "Welcome back."} footer={<>New to Markpath? <Link className="font-medium text-ink hover:text-brand" href="/signup">Create an account</Link></>} title="Sign in to Markpath"><LoginForm /></AuthFrame>;
}
