"use client";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const field = "rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2";
export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {} as SignupState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1 text-sm font-medium">Name<input className={field} name="name" autoComplete="name" required /></label>
    <label className="grid gap-1 text-sm font-medium">Work email<input className={field} name="email" type="email" autoComplete="email" required /></label>
    <label className="grid gap-1 text-sm font-medium">Password<input className={field} name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
    <button className="rounded-[var(--radius-control)] bg-brand px-3 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
  </form>;
}
