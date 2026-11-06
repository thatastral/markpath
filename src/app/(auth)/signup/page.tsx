import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return <main className="mx-auto grid min-h-screen max-w-md place-content-center px-6"><section className="rounded-lg border border-border bg-surface p-6 shadow-sm"><p className="text-sm font-semibold text-brand">Markpath</p><h1 className="mt-2 text-2xl font-semibold">Create your account</h1><p className="mt-2 text-sm text-muted">Next you will create a workspace for your brand.</p><SignupForm /><p className="mt-4 text-sm text-muted">Already have an account? <Link className="underline" href="/login">Sign in</Link></p></section></main>;
}
