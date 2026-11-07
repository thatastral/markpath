"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";

const field = `${inputClass} lg:min-h-9`;

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action] = useActionState(login, initialState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Email<input autoFocus className={field} name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Password<input className={field} name="password" type="password" autoComplete="current-password" required /></label>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Signing in…">Sign in</SubmitButton>
  </form>;
}
