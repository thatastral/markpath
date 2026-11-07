"use client";
import { useActionState, useState, type FormEvent } from "react";
import { createWorkspaceAction, type WorkspaceState } from "./actions";
import { buttonClass } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, fieldAria, TextInput } from "@/components/ui/form-field";

export function WorkspaceForm() {
  const [state, action] = useActionState(createWorkspaceAction, {} as WorkspaceState);
  const [nameError, setNameError] = useState<string>();
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    if (!name) { e.preventDefault(); setNameError("Enter your brand or company name."); e.currentTarget.querySelector<HTMLInputElement>("#ws-name")?.focus(); }
  }
  return <form action={action} className="grid gap-4" noValidate onSubmit={onSubmit}>
    <Field error={nameError} id="ws-name" label="Brand or company name"><TextInput {...fieldAria("ws-name", nameError)} autoComplete="organization" autoFocus invalid={Boolean(nameError)} maxLength={100} name="name" onChange={() => nameError && setNameError(undefined)} required /></Field>
    <Field hint="Shown under the workspace name on Overview." id="ws-description" label="Short description" optional><TextInput {...fieldAria("ws-description", undefined, true)} autoComplete="off" name="description" /></Field>
    <Field hint="Your username in your chat app, without the @. Lets you approve changes by replying in the chat room." id="ws-handle" label="Chat username" optional><TextInput {...fieldAria("ws-handle", undefined, true)} autoCapitalize="none" autoComplete="off" name="chatHandle" placeholder="your-username" spellCheck={false} /></Field>
    <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-3 text-sm hover:bg-hover has-[:checked]:border-brand/60 has-[:checked]:bg-brand-soft/40" htmlFor="ws-demo"><input className="mt-0.5 shrink-0" id="ws-demo" name="demoData" type="checkbox" /><span><span className="font-medium">Try it with a sample brand</span><br /><span className="text-muted">Adds the Nexa sample brand, so you can try the whole flow with nothing to connect.</span></span></label>
    {state.error && <p className="anim-rise rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>}
    <SubmitButton className={buttonClass("primary", "md", "mt-1 w-full lg:min-h-9")} pendingLabel="Creating…">Create workspace</SubmitButton>
  </form>;
}
