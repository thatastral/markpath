import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main className="mx-auto grid min-h-screen max-w-md place-content-center px-6"><section className="rounded-lg border border-border bg-surface p-6 shadow-sm"><p className="text-sm font-semibold text-brand">Markpath</p><h1 className="mt-2 text-2xl font-semibold">Sign in to your workspace</h1><p className="mt-2 text-sm text-muted">Use the seeded demo account from the setup guide.</p><LoginForm /><p className="mt-4 text-sm text-muted">New to Markpath? <Link className="underline" href="/signup">Create an account</Link></p></section></main>;
}
