"use client";
import { useActionState, useState, type FormEvent } from "react";
import { signup, type SignupState } from "./actions";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, fieldAria, looksLikeEmail, PasswordInput, TextInput } from "@/components/ui/form-field";

type Errors = { name?: string; email?: string; password?: string };

export function SignupForm() {
  const [state, action] = useActionState(signup, {} as SignupState);
  const [errors, setErrors] = useState<Errors>({});
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget); const next: Errors = {};
    const name = String(f.get("name") ?? "").trim(); const email = String(f.get("email") ?? ""); const password = String(f.get("password") ?? "");
    if (!name) next.name = "Enter your name.";
    if (!email.trim()) next.email = "Enter your work email."; else if (!looksLikeEmail(email)) next.email = "Enter an email like name@company.com.";
    if (password.length < 8) next.password = password ? `Use at least 8 characters. This one has ${password.length}.` : "Choose a password.";
    setErrors(next);
    const first = (["name", "email", "password"] as const).find((k) => next[k]);
    if (first) { e.preventDefault(); e.currentTarget.querySelector<HTMLInputElement>(`#signup-${first}`)?.focus(); }
  }
  const clear = (k: keyof Errors) => () => errors[k] && setErrors((x) => ({ ...x, [k]: undefined }));
  return <form action={action} className="mt-6 grid gap-4" noValidate onSubmit={onSubmit}>
    <Field error={errors.name} id="signup-name" label="Name"><TextInput {...fieldAria("signup-name", errors.name)} autoComplete="name" autoFocus invalid={Boolean(errors.name)} name="name" onChange={clear("name")} required /></Field>
    <Field error={errors.email} id="signup-email" label="Work email"><TextInput {...fieldAria("signup-email", errors.email)} autoCapitalize="none" autoComplete="email" inputMode="email" invalid={Boolean(errors.email)} name="email" onChange={clear("email")} required spellCheck={false} type="email" /></Field>
    <Field error={errors.password} hint="At least 8 characters." id="signup-password" label="Password"><PasswordInput autoComplete="new-password" describedBy={errors.password ? "signup-password-error" : "signup-password-hint"} id="signup-password" invalid={Boolean(errors.password)} minLength={8} name="password" onChange={clear("password")} required /></Field>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Creating account…">Create account</SubmitButton>
  </form>;
}
