"use client";
import { useActionState } from "react";
import { signup, type SignupState } from "./actions";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";

const field = `${inputClass} lg:min-h-9`;


export function SignupForm() {
  const [state, action] = useActionState(signup, {} as SignupState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Name<input autoFocus className={field} name="name" autoComplete="name" required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Work email<input className={field} name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Password<input className={field} name="password" type="password" autoComplete="new-password" minLength={8} required /><span className="text-xs font-normal">At least 8 characters.</span></label>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Creating account…">Create account</SubmitButton>
  </form>;
}
