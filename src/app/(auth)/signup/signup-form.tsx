"use client";
import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { signup, type SignupState } from "./actions";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, fieldAria, looksLikeEmail, PasswordInput, TextInput } from "@/components/ui/form-field";

type Errors = { name?: string; email?: string; password?: string };

export function SignupForm() {
  const [state, action] = useActionState(signup, {} as SignupState);
  const [errors, setErrors] = useState<Errors>({});
  // The server's error shows beside its field until the person edits that field.
  const [dismissed, setDismissed] = useState<number | undefined>();
  const server = state.error && dismissed !== state.n ? { [state.field ?? "email"]: state.error } as Errors : {};
  const shown: Errors = { name: errors.name ?? server.name, email: errors.email ?? server.email, password: errors.password ?? server.password };
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget); const next: Errors = {};
    const name = String(f.get("name") ?? "").trim(); const email = String(f.get("email") ?? ""); const password = String(f.get("password") ?? "");
    if (!name) next.name = "Enter your name.";
    if (!email.trim()) next.email = "Enter your work email."; else if (!looksLikeEmail(email)) next.email = "Enter an email like name@company.com.";
    if (password.length < 8) next.password = password ? `Use at least 8 characters. This one has ${password.length}.` : "Choose a password.";
    setErrors(next); setDismissed(state.n);
    const first = (["name", "email", "password"] as const).find((k) => next[k]);
    if (first) { e.preventDefault(); e.currentTarget.querySelector<HTMLInputElement>(`#signup-${first}`)?.focus(); }
  }
  const clear = (k: keyof Errors) => () => { if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); if (server[k]) setDismissed(state.n); };
  const focus = state.error ? state.field ?? "email" : "name";
  return <form action={action} className="grid gap-4" key={state.n ?? 0} noValidate onSubmit={onSubmit}>
    <Field error={shown.name} id="signup-name" label="Name"><TextInput {...fieldAria("signup-name", shown.name)} autoComplete="name" autoFocus={focus === "name"} defaultValue={state.name} invalid={Boolean(shown.name)} name="name" onChange={clear("name")} required /></Field>
    <Field error={shown.email} id="signup-email" label="Work email"><TextInput {...fieldAria("signup-email", shown.email)} autoCapitalize="none" autoComplete="email" autoFocus={focus === "email"} defaultValue={state.email} inputMode="email" invalid={Boolean(shown.email)} name="email" onChange={clear("email")} required spellCheck={false} type="email" /></Field>
    {server.email && state.error?.includes("already has an account") && <p className="-mt-2 text-xs"><Link className="font-medium text-brand hover:underline" href="/login">Sign in instead</Link></p>}
    <Field error={shown.password} hint="At least 8 characters." id="signup-password" label="Password"><PasswordInput autoComplete="new-password" autoFocus={focus === "password"} describedBy={shown.password ? "signup-password-error" : "signup-password-hint"} id="signup-password" invalid={Boolean(shown.password)} minLength={8} name="password" onChange={clear("password")} required /></Field>
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Creating account…">Create account</SubmitButton>
  </form>;
}
