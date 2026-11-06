"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1 text-sm font-medium">Email<input className="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2" name="email" type="email" autoComplete="email" required /></label>
    <label className="grid gap-1 text-sm font-medium">Password<input className="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2" name="password" type="password" autoComplete="current-password" required /></label>
    {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
    <button className="rounded-[var(--radius-control)] bg-brand px-3 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
  </form>;
}
