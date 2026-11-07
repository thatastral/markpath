"use client";
import Link from "next/link";
import { useActionState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, fieldAria, TextInput } from "@/components/ui/form-field";
import { forgotPassword, type ForgotState } from "./actions";

export function ForgotForm() {
  const [state, action] = useActionState<ForgotState, FormData>(forgotPassword, {});
  if (state.sent) return <div className="mt-6 space-y-4 text-center" role="status">
    <p className="text-sm">If <strong className="font-medium">{state.sent}</strong> has an account, a reset link is on its way. It works for 30 minutes.</p>
    <p className="text-xs text-muted">No email? Check spam, or try again in a minute.</p>
    <Link className={buttonClass("secondary", "md", "w-full")} href="/login">Back to sign in</Link>
  </div>;
  return <form action={action} className="mt-6 grid gap-4">
    <Field error={state.error} id="forgot-email" label="Email"><TextInput {...fieldAria("forgot-email", state.error)} autoCapitalize="none" autoComplete="email" autoFocus inputMode="email" invalid={Boolean(state.error)} name="email" required spellCheck={false} type="email" /></Field>
    <SubmitButton className={buttonClass("primary", "md", "w-full lg:min-h-9")} pendingLabel="Sending…">Send reset link</SubmitButton>
  </form>;
}
