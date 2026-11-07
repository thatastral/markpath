import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main className="mx-auto grid min-h-screen max-w-md place-content-center px-6"><section className="rounded-lg border border-border bg-surface p-6 shadow-sm"><p className="text-sm font-semibold text-brand">Markpath</p><h1 className="mt-2 text-2xl font-semibold">Sign in to your workspace</h1>{process.env.NODE_ENV !== "production" ? <p className="mt-2 text-sm text-muted">Trying the demo? Use demo@markpath.local with the password markpath-demo.</p> : <p className="mt-2 text-sm text-muted">Welcome back.</p>}<LoginForm /><p className="mt-4 text-sm text-muted">New to Markpath? <Link className="underline" href="/signup">Create an account</Link></p></section></main>;
}
