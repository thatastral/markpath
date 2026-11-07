"use client";
import { useActionState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, PasswordInput } from "@/components/ui/form-field";
import { chooseNewPassword, type ResetState } from "../forgot-password/actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<ResetState, FormData>(chooseNewPassword, {});
  return <form action={action} className="mt-6 grid gap-4">
    <input name="token" type="hidden" value={token} />
    <Field hint="At least 8 characters." id="reset-password" label="New password"><PasswordInput autoComplete="new-password" autoFocus id="reset-password" minLength={8} name="password" required /></Field>
    <Field error={state.error} id="reset-confirm" label="Confirm new password"><PasswordInput autoComplete="new-password" describedBy={state.error ? "reset-confirm-error" : undefined} id="reset-confirm" invalid={Boolean(state.error)} minLength={8} name="confirm" required /></Field>
    <SubmitButton className={buttonClass("primary", "md", "w-full lg:min-h-9")} pendingLabel="Saving…">Save new password</SubmitButton>
  </form>;
}
