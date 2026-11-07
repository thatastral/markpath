"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, PasswordInput } from "@/components/ui/form-field";
import { CheckIcon } from "@/components/ui/icons";
import { chooseNewPassword, type ResetState } from "../forgot-password/actions";

/** Shown after a successful reset: confirms the change, then opens the app. */
export function PasswordChanged() {
  const router = useRouter();
  useEffect(() => { const t = setTimeout(() => router.replace("/"), 2500); return () => clearTimeout(t); }, [router]);
  return <div className="mt-6 grid gap-4 text-center" role="status">
    <p className="anim-rise inline-flex items-center justify-center gap-2 text-sm"><CheckIcon className="text-success" size={16} />You&apos;re signed in with your new password.</p>
    <Link className={buttonClass("primary", "md", "w-full lg:min-h-9")} data-autofocus href="/" replace>Continue to Markpath</Link>
  </div>;
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<ResetState, FormData>(chooseNewPassword, {});
  // The error stays until the person starts typing again.
  const [dismissed, setDismissed] = useState<number | undefined>();
  const first = useRef<HTMLDivElement>(null);
  const error = state.error && dismissed !== state.n ? state.error : undefined;
  useEffect(() => { if (state.n) first.current?.querySelector("input")?.focus(); }, [state.n]);
  const clear = () => { if (error) setDismissed(state.n); };
  return <form action={action} className="mt-6 grid gap-4" key={state.n ?? 0}>
    <input name="token" type="hidden" value={token} />
    <div ref={first}><Field error={error} hint="At least 8 characters." id="reset-password" label="New password"><PasswordInput autoComplete="new-password" autoFocus describedBy={error ? "reset-password-error" : "reset-password-hint"} id="reset-password" invalid={Boolean(error)} minLength={8} name="password" onChange={clear} required /></Field></div>
    <Field id="reset-confirm" label="Confirm new password"><PasswordInput autoComplete="new-password" id="reset-confirm" invalid={Boolean(error)} minLength={8} name="confirm" onChange={clear} required /></Field>
    <SubmitButton className={buttonClass("primary", "md", "w-full lg:min-h-9")} pendingLabel="Saving…">Save new password</SubmitButton>
  </form>;
}
