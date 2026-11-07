"use client";
import { useActionState } from "react";
import { createWorkspaceAction, type WorkspaceState } from "./actions";
import { buttonClass, inputClass } from "@/components/ui/primitives";

const field = `${inputClass} lg:min-h-9`;


export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspaceAction, {} as WorkspaceState);
  return <form action={action} className="grid gap-4" noValidate>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Brand or company name<input className={field} name="name" required /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">One-line description (optional)<input className={field} name="description" /></label>
    <label className="grid gap-1.5 text-xs font-medium text-muted">Your chat handle (optional)<input className={field} name="chatHandle" placeholder="switch-admin" /><span className="text-xs font-normal text-muted">Lets you approve changes by replying in the chat room. Your handle in Mattermost, Slack or Telegram, without the @.</span></label>
    <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-3 text-sm hover:bg-hover has-[:checked]:border-brand/60"><input className="mt-0.5 shrink-0" name="demoData" type="checkbox" /><span><span className="font-medium">Start with the Nexa demo brand</span><br /><span className="text-muted">Loads the sample guideline and sets up fixtures so you can try the full flow with nothing to connect.</span></span></label>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <button className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} type="submit" disabled={pending}>{pending ? "Creating…" : "Create workspace"}</button>
  </form>;
}
