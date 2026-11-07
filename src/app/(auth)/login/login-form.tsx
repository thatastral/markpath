"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1.5 text-sm font-medium">Email<input className="rounded-control border border-border-strong bg-surface px-3 py-2 text-base font-normal shadow-card hover:border-muted sm:text-sm" name="email" type="email" autoComplete="email" required /></label>
    <label className="grid gap-1.5 text-sm font-medium">Password<input className="rounded-control border border-border-strong bg-surface px-3 py-2 text-base font-normal shadow-card hover:border-muted sm:text-sm" name="password" type="password" autoComplete="current-password" required /></label>
    {state.error && <p className="anim-rise rounded-control bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <button className="mt-1 inline-flex min-h-11 items-center justify-center rounded-control bg-brand-solid px-4 text-sm font-medium text-white shadow-card hover:bg-brand-solid-hover disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
  </form>;
}
