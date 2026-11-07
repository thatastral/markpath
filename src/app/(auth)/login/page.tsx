import Link from "next/link";
import { Logo } from "@/components/main-nav";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10"><div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-brand-soft),transparent)]" /><section className="anim-rise relative w-full max-w-sm"><div className="mb-6 flex items-center justify-center gap-2 font-semibold tracking-tight"><Logo />Markpath</div><div className="rounded-card border border-border bg-surface p-6 shadow-pop sm:p-8"><h1 className="text-xl font-semibold tracking-tight">Sign in to your workspace</h1>{process.env.NODE_ENV !== "production" ? <p className="mt-2 text-sm text-muted">Trying the demo? Use demo@markpath.local with the password markpath-demo.</p> : <p className="mt-2 text-sm text-muted">Welcome back.</p>}<LoginForm /></div><p className="mt-5 text-center text-sm text-muted">New to Markpath? <Link className="font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand" href="/signup">Create an account</Link></p></section></main>;
}
