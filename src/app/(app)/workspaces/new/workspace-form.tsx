"use client";
import { useActionState } from "react";
import { createWorkspaceAction, type WorkspaceState } from "./actions";

const field = "rounded-control border border-border-strong bg-surface px-3 py-2 text-base font-normal shadow-card hover:border-muted sm:text-sm";
export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspaceAction, {} as WorkspaceState);
  return <form action={action} className="mt-6 grid gap-4" noValidate>
    <label className="grid gap-1.5 text-sm font-medium">Brand or company name<input className={field} name="name" required /></label>
    <label className="grid gap-1.5 text-sm font-medium">One-line description (optional)<input className={field} name="description" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Your chat handle (optional)<input className={field} name="chatHandle" placeholder="switch-admin" /><span className="text-xs font-normal leading-relaxed text-muted">Lets you approve changes by replying in the chat room. Your handle in Mattermost, Slack or Telegram, without the @.</span></label>
    <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border bg-subtle/60 p-3 text-sm hover:border-border-strong has-[:checked]:border-brand/50 has-[:checked]:bg-brand-soft"><input className="mt-0.5 shrink-0" name="demoData" type="checkbox" /><span><span className="font-medium">Start with the Nexa demo brand</span><br /><span className="text-muted">Loads the sample guideline and sets up fixtures so you can try the full flow with nothing to connect.</span></span></label>
    {state.error && <p className="anim-rise rounded-control bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <button className="mt-1 inline-flex min-h-11 items-center justify-center rounded-control bg-brand-solid px-4 text-sm font-medium text-white shadow-card hover:bg-brand-solid-hover disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Creating…" : "Create workspace"}</button>
  </form>;
}
