"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, fieldAria, TextInput } from "@/components/ui/form-field";
import { forgotPassword, type ForgotState } from "./actions";

const COOLDOWN = 30;
const back = "text-xs font-medium text-brand hover:underline hover:underline-offset-4";

export function ForgotForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, action] = useActionState<ForgotState, FormData>(forgotPassword, {});
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!state.at) return;
    setLeft(COOLDOWN);
    const t = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [state.at]);

  if (state.sent) return <div className="mt-6 space-y-4 text-center" role="status">
    <p className="text-sm">If <strong className="font-medium">{state.sent}</strong> has an account, a reset link is on its way. It works for 30 minutes.</p>
    <p className="text-xs text-muted">No email? Check your spam folder.</p>
    <form action={action}>
      <input name="email" type="hidden" value={state.sent} />
      <SubmitButton className={buttonClass("secondary", "md", "w-full")} disabled={left > 0} pendingLabel="Sending…">{left > 0 ? `Resend link in ${left}s` : "Resend link"}</SubmitButton>
    </form>
    <Link className={back} href="/login">Back to sign in</Link>
  </div>;
  return <form action={action} className="grid gap-4" key={state.n ?? 0}>
    <Field error={state.error} id="forgot-email" label="Email"><TextInput {...fieldAria("forgot-email", state.error)} autoCapitalize="none" autoComplete="email" autoFocus defaultValue={state.email ?? defaultEmail} inputMode="email" invalid={Boolean(state.error)} name="email" required spellCheck={false} type="email" /></Field>
    <SubmitButton className={buttonClass("primary", "md", "w-full lg:min-h-9")} pendingLabel="Sending…">Send reset link</SubmitButton>
    <p className="text-center"><Link className={back} href="/login">Back to sign in</Link></p>
  </form>;
}
