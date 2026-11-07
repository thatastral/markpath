"use client";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";
import { buttonClass, inputClass } from "@/components/ui/primitives";

const field = `${inputClass} lg:min-h-9`;


export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {} as SignupState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Name<input className={field} name="name" autoComplete="name" required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Work email<input className={field} name="email" type="email" autoComplete="email" required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Password<input className={field} name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <button className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
  </form>;
}
