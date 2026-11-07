"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { login, type LoginState } from "./actions";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, fieldAria, looksLikeEmail, PasswordInput, TextInput } from "@/components/ui/form-field";

const initialState: LoginState = {};
type Errors = { email?: string; password?: string };

export function LoginForm() {
  const [state, action] = useActionState(login, initialState);
  const [errors, setErrors] = useState<Errors>({});
  // Check on submit and show errors next to each field; the first problem gets focus.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget); const next: Errors = {};
    const email = String(f.get("email") ?? ""); const password = String(f.get("password") ?? "");
    if (!email.trim()) next.email = "Enter your email."; else if (!looksLikeEmail(email)) next.email = "Enter an email like name@company.com.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (next.email || next.password) { e.preventDefault(); e.currentTarget.querySelector<HTMLInputElement>(next.email ? "#login-email" : "#login-password")?.focus(); }
  }
  const clear = (k: keyof Errors) => () => errors[k] && setErrors((x) => ({ ...x, [k]: undefined }));
  return <form action={action} className="mt-6 grid gap-4" noValidate onSubmit={onSubmit}>
    <Field error={errors.email} id="login-email" label="Email"><TextInput {...fieldAria("login-email", errors.email)} autoCapitalize="none" autoComplete="email" autoFocus inputMode="email" invalid={Boolean(errors.email)} name="email" onChange={clear("email")} required spellCheck={false} type="email" /></Field>
    <Field action={<Link className="text-xs font-medium text-brand hover:underline hover:underline-offset-4" href="/forgot-password">Forgot password?</Link>} error={errors.password} id="login-password" label="Password"><PasswordInput autoComplete="current-password" describedBy={errors.password ? "login-password-error" : undefined} id="login-password" invalid={Boolean(errors.password)} name="password" onChange={clear("password")} required /></Field>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Signing in…">Sign in</SubmitButton>
  </form>;
}
