"use client";
import { useActionState } from "react";
import { createWorkspaceAction, type WorkspaceState } from "./actions";
import { buttonClass, inputClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";

const field = `${inputClass} lg:min-h-9`;


export function WorkspaceForm() {
  const [state, action] = useActionState(createWorkspaceAction, {} as WorkspaceState);
  return <form action={action} className="grid gap-4" noValidate>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Brand or company name<input autoComplete="organization" autoFocus className={field} name="name" required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Short description (optional)<input autoComplete="off" className={field} name="description" /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Your chat username (optional)<input autoCapitalize="none" autoComplete="off" className={field} name="chatHandle" placeholder="your-username" spellCheck={false} /><span className="text-xs font-normal text-muted">Without the @. Lets you approve changes by replying in the chat room.</span></label>
    <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-3 text-sm hover:bg-hover has-[:checked]:border-brand/60"><input className="mt-0.5 shrink-0" name="demoData" type="checkbox" /><span><span className="font-medium">Start with the Nexa demo brand</span><br /><span className="text-muted">Loads a sample brand so you can try the whole flow with nothing to connect.</span></span></label>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Creating…">Create workspace</SubmitButton>
  </form>;
}
