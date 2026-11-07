"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClass, inputClass, Notice } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDrop, UrlInput } from "@/components/ui/file-drop";
import { AlertIcon } from "@/components/ui/icons";
import { saveAgentPrefix, saveDesignLinks, uploadOnboardingLogo, type DesignState, type PrefixState } from "./actions";

const fieldLabel = "text-xs font-medium text-ink";
const help = "block text-xs text-muted";

function Actions({ children, skip }: { children?: ReactNode; skip?: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">{skip ? <Link className={buttonClass("ghost")} href={skip}>Skip for now</Link> : <span />}<span className="ml-auto flex gap-2">{children}</span></div>;
}

/** Step 2. Thumbnail of the chosen (or saved) logo; the button reads "Continue" when no file is chosen. */
export function LogoStep({ saved, savedPreview }: { saved: boolean; savedPreview?: string }) {
  const [file, setFile] = useState<File | null>(null);
  return <form action={uploadOnboardingLogo} className="space-y-4">
    <div className="space-y-1.5"><label className={fieldLabel} htmlFor="onb-logo">Logo file</label>
      <FileDrop accept="image/png,image/jpeg,image/webp" autoFocus hint={saved ? "Your logo is saved. Choose another to replace it." : "PNG, JPG or WebP, up to 1 MB."} id="onb-logo" maxBytes={1_000_000} name="logo" onFileChange={setFile} preview savedPreview={savedPreview} />
    </div>
    <Actions><SubmitButton className={buttonClass("primary")} pendingLabel={file ? "Saving…" : "Opening…"}>{file ? "Save and continue" : "Continue"}</SubmitButton></Actions>
  </form>;
}

/** Step 4. Errors come back as action state beside the field, and both links stay filled. */
export function DesignStep({ figma, canva, skip }: { figma: string; canva: string; skip?: string }) {
  const [state, action] = useActionState<DesignState, FormData>(saveDesignLinks, {});
  const root = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.field) root.current?.querySelector<HTMLInputElement>(`#onb-${state.field}`)?.focus(); }, [state.n, state.field]);
  return <form action={action} className="space-y-4" key={state.n ?? 0} ref={root}>
    <div className="space-y-1.5"><label className={fieldLabel} htmlFor="onb-figma">Figma file link</label>
      <UrlInput autoFocus defaultValue={state.figma ?? figma} error={state.field === "figma" ? state.error : undefined} id="onb-figma" name="figma" placeholder="https://www.figma.com/design/…" site="figma" /></div>
    <div className="space-y-1.5"><label className={fieldLabel} htmlFor="onb-canva">Canva design link</label>
      <UrlInput defaultValue={state.canva ?? canva} error={state.field === "canva" ? state.error : undefined} id="onb-canva" name="canva" placeholder="https://www.canva.com/design/…" site="canva" /></div>
    <p className={help}>Add one or both. The Design agent edits them through your Figma and Canva accounts, so connect both once in <a className="font-medium text-brand hover:underline" href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">Claude settings<span className="sr-only"> (opens in a new tab)</span></a> on the computer that runs your agents. In Canva it changes colours only, not fonts.</p>
    <Actions skip={skip}><SubmitButton className={buttonClass("primary")} pendingLabel="Saving…">Save and continue</SubmitButton></Actions>
  </form>;
}

/** Step 5, before the template: the agents' name prefix. The template carries these names, so set it first. */
export function AgentPrefixForm({ prefix }: { prefix: string }) {
  const [state, action] = useActionState<PrefixState, FormData>(saveAgentPrefix, {});
  const [value, setValue] = useState(prefix);
  const current = state.saved ?? prefix;
  const error = state.error && value === state.value ? state.error : undefined;
  const clean = value.trim().toLowerCase() || "markpath";
  return <form action={action} className="grid gap-2">
    <label className={fieldLabel} htmlFor="onb-prefix">Agent name prefix</label>
    <span className="flex flex-wrap items-center gap-2">
      <input aria-describedby={`onb-prefix-hint${error ? " onb-prefix-error" : ""}`} aria-invalid={error ? true : undefined} autoCapitalize="none" autoComplete="off" className={`${inputClass} max-w-[14rem] font-mono ${error ? "border-danger" : ""}`} id="onb-prefix" maxLength={20} name="prefix" onChange={(e) => setValue(e.target.value)} spellCheck={false} value={value} />
      <SubmitButton className={buttonClass("secondary")} disabled={clean === current} pendingLabel="Saving…">Save name</SubmitButton>
    </span>
    {error && <p className="anim-rise flex items-start gap-1.5 text-xs text-danger" id="onb-prefix-error" role="alert"><AlertIcon className="mt-px shrink-0" size={13} />{error}</p>}
    <p className={help} id="onb-prefix-hint">Your agents will be called <span className="font-mono text-ink">@{clean}-director</span> and <span className="font-mono text-ink">@{clean}-design</span>. Set this before you copy the template: changing it later means making the room again.</p>
    {state.saved && !error && <Notice tone="success" role="status">Saved. Your agents are now @{state.saved}-director and @{state.saved}-design.</Notice>}
  </form>;
}
