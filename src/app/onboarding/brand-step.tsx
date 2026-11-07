"use client";
import { useActionState, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { buttonClass, inputClass, Notice, Swatch } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDrop, UrlInput } from "@/components/ui/file-drop";
import { AlertIcon } from "@/components/ui/icons";
import type { DraftSuggestion } from "@/server/brand/extract";
import { confirmBrand, readGuideline, type ConfirmState, type ReadState } from "./actions";

const sources = [
  { id: "file", label: "File", hint: "PDF, Markdown or text" },
  { id: "website", label: "Website", hint: "Your site's address" },
  { id: "design", label: "Design file", hint: "A Figma or Canva link" },
] as const;
type Source = (typeof sources)[number]["id"];

const label = "text-xs font-medium text-ink";
const help = "text-xs text-muted";

/**
 * Step 1. With `initial`, opens straight on the review form prefilled with the saved rules (editing creates a new version).
 * `cancelHref` is where "Cancel" goes when rules already exist.
 */
export function BrandStep({ initial, cancelHref }: { initial?: DraftSuggestion; cancelHref?: string }) {
  const [source, setSource] = useState<Source>("file");
  const [read, readAction] = useActionState<ReadState, FormData>(readGuideline, {});
  const [confirm, confirmAction] = useActionState<ConfirmState, FormData>(confirmBrand, {});
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const s = read.suggestion;
  // After a rejected read, focus goes back to the field that needs fixing.
  useEffect(() => { if (read.n && read.error) document.getElementById(source === "file" ? "brand-file" : "brand-link")?.focus(); }, [read.n, read.error, source]);

  if (s) return <ReviewForm key={read.sourceName} read={read} action={confirmAction} state={confirm} restartHref={cancelHref ? "/onboarding?step=brand&new=1" : "/onboarding?step=brand"} />;
  if (initial) return <ReviewForm read={{ suggestion: initial, kind: undefined, sourceName: "your edit", note: "Change any value and save. This makes a new version of your rules." }} action={confirmAction} state={confirm} restartHref={cancelHref ?? "/brand"} restartLabel="Cancel" />;

  // Arrow keys, Home and End move between the source tabs (WAI-ARIA tabs pattern).
  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = sources.findIndex((o) => o.id === source);
    const to = e.key === "ArrowRight" ? (i + 1) % sources.length : e.key === "ArrowLeft" ? (i - 1 + sources.length) % sources.length : e.key === "Home" ? 0 : e.key === "End" ? sources.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault(); setSource(sources[to].id); tabs.current[to]?.focus();
  }
  const linkError = read.error && source !== "file" ? read.error : undefined;

  return <div className="space-y-5">
    <div role="tablist" aria-label="Where are your brand rules?" className="grid grid-cols-3 gap-1 rounded-control bg-hover p-1" onKeyDown={onTabKey}>
      {sources.map((o, i) => <button key={o.id} ref={(el) => { tabs.current[i] = el; }} id={`source-${o.id}`} role="tab" aria-selected={source === o.id} aria-controls="source-panel" tabIndex={source === o.id ? 0 : -1} type="button" onClick={() => setSource(o.id)} className={`press min-h-10 whitespace-nowrap rounded-[6px] px-2 text-sm font-medium lg:min-h-8 ${source === o.id ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted hover:text-ink"}`}>{o.label}</button>)}
    </div>
    <form action={readAction} aria-labelledby={`source-${source}`} className="space-y-3" id="source-panel" key={`${source}-${read.n ?? 0}`} role="tabpanel">
      <input type="hidden" name="kind" value={source === "file" ? "file" : "link"} />
      {source === "file" ? <div className="space-y-1.5">
        <label className={label} htmlFor="brand-file">Brand guideline</label>
        <FileDrop accept=".pdf,.md,.markdown,.txt" autoFocus hint="PDF, Markdown or text, up to 10 MB." id="brand-file" maxBytes={10_000_000} name="file" required />
      </div> : <div className="space-y-1.5">
        <label className={label} htmlFor="brand-link">{source === "website" ? "Website address" : "Figma or Canva link"}</label>
        {source === "design" && <p className={help} id="brand-link-limits">Markpath saves the design so the agents can check it, but it can&apos;t read rules from a design yet. You&apos;ll type your colour, typeface and corner radius on the next screen.</p>}
        <UrlInput autoFocus={Boolean(linkError)} defaultValue={read.link} error={linkError} site={source === "design" ? "design" : undefined} id="brand-link" name="link" placeholder={source === "website" ? "https://yourcompany.com" : "https://www.figma.com/design/…"} required />
        {source === "website" && <span className={`block ${help}`}>Markpath reads its colours and fonts. Nothing on your site changes. Reading can take up to 20 seconds.</span>}
      </div>}
      {read.error && source === "file" && <Notice tone="danger" role="alert">{read.error}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton className={buttonClass("primary")} pendingLabel={source === "website" ? "Reading the site…" : "Reading…"}>{source === "file" ? "Read file" : source === "website" ? "Read website" : "Save link"}</SubmitButton>
        {cancelHref && <a className={buttonClass("ghost")} href={cancelHref}>Cancel</a>}
      </div>
    </form>
    <form action={readAction} className="border-t border-border pt-4">
      <input type="hidden" name="kind" value="sample" />
      <p className={`${help} flex flex-wrap items-center gap-x-1`}>No guideline handy? <SubmitButton className="inline-flex min-h-10 items-center font-medium text-brand hover:underline lg:min-h-6" pendingLabel="Loading sample…">Try a sample brand</SubmitButton></p>
    </form>
  </div>;
}

type Values = { primaryColour: string; typeface: string; buttonRadius: string; previousColour: string; previousTypeface: string; previousRadius: string; voice: string };
const HEX = /^#?[0-9a-fA-F]{6}$/; const PX = /^\d+(\.\d+)?(px)?$/;
function check(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {};
  if (!HEX.test(v.primaryColour.trim())) e.primaryColour = v.primaryColour.trim() ? "Use a 6-digit hex colour, like #1A73E8." : "Add your primary colour, like #1A73E8.";
  if (!v.typeface.trim()) e.typeface = "Add the main typeface.";
  if (!PX.test(v.buttonRadius.trim())) e.buttonRadius = "Use pixels, like 8px.";
  if (v.previousColour.trim() && !HEX.test(v.previousColour.trim())) e.previousColour = "Use a 6-digit hex colour, or leave it blank.";
  if (v.previousRadius.trim() && !PX.test(v.previousRadius.trim())) e.previousRadius = "Use pixels, like 4px, or leave it blank.";
  return e;
}
const order: Array<keyof Values> = ["primaryColour", "typeface", "buttonRadius", "voice", "previousColour", "previousTypeface", "previousRadius"];

function Input({ name, title, value, onChange, placeholder, error, hint, swatch, autoFocus }: { name: keyof Values; title: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; hint?: string; swatch?: boolean; autoFocus?: boolean }) {
  const id = `brand-${name}`;
  const described = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return <div className="block min-w-0 space-y-1.5">
    <label className={`block ${label}`} htmlFor={id}>{title}</label>
    <span className="flex items-center gap-2">
      {swatch && <Swatch value={HEX.test(value) ? (value.startsWith("#") ? value : `#${value}`) : "#FFFFFF"} className="h-8 w-8 shrink-0" />}
      <input aria-describedby={described} aria-invalid={error ? true : undefined} autoComplete="off" autoFocus={autoFocus} className={`${inputClass} ${error ? "border-danger" : ""}`} id={id} name={name} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} value={value} />
    </span>
    {error && <p className="anim-rise flex items-start gap-1.5 text-xs text-danger" id={`${id}-error`}><AlertIcon className="mt-px shrink-0" size={13} />{error}</p>}
    {hint && <p className={help} id={`${id}-hint`}>{hint}</p>}
  </div>;
}

function ReviewForm({ read, action, state, restartHref, restartLabel = "Start over" }: { read: ReadState; action: (f: FormData) => void; state: ConfirmState; restartHref: string; restartLabel?: string }) {
  const s = read.suggestion!;
  const [v, setV] = useState<Values>({ primaryColour: s.primaryColour ?? "", typeface: s.typeface ?? "", buttonRadius: s.buttonRadius ?? "", previousColour: s.previousColour ?? "", previousTypeface: s.previousTypeface ?? "", previousRadius: s.previousRadius ?? "", voice: s.voice ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [dismissed, setDismissed] = useState<number | undefined>();
  const form = useRef<HTMLFormElement>(null);
  const serverField = state.error && dismissed !== state.n ? (state.field && state.field in v ? state.field as keyof Values : undefined) : undefined;
  const shown = (k: keyof Values) => errors[k] ?? (serverField === k ? state.error : undefined);
  const generalError = state.error && dismissed !== state.n && !serverField ? state.error : undefined;
  const set = (k: keyof Values) => (value: string) => { setV((x) => ({ ...x, [k]: value })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); if (serverField === k) setDismissed(state.n); };
  // A server rejection moves focus to the field it names.
  useEffect(() => { if (state.n && state.field) form.current?.querySelector<HTMLInputElement>(`#brand-${state.field}`)?.focus(); }, [state.n, state.field]);
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const next = check(v); setErrors(next); setDismissed(state.n);
    const first = order.find((k) => next[k]);
    if (first) { e.preventDefault(); form.current?.querySelector<HTMLInputElement>(`#brand-${first}`)?.focus(); }
  }
  const upper = v.primaryColour.toUpperCase();
  return <form action={action} className="space-y-5" noValidate onSubmit={onSubmit} ref={form}>
    <input type="hidden" name="kind" value={read.kind ?? "manual"} />
    <input type="hidden" name="sourceName" value={read.sourceName ?? ""} />
    {read.note && <Notice tone={s.found.length ? "success" : "neutral"} role="status">{read.note}</Notice>}

    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">Your brand rules</legend>
      <Input autoFocus error={shown("primaryColour")} name="primaryColour" onChange={set("primaryColour")} placeholder="e.g. #1A73E8" swatch title="Primary colour" value={v.primaryColour} />
      {s.colours.length > 1 && <div aria-label="Colours found in your source" className="-mt-1 flex flex-wrap items-center gap-1.5" role="group"><span aria-hidden className={help}>Found in your source:</span>{s.colours.slice(0, 6).map((c) => <button key={c} type="button" onClick={() => set("primaryColour")(c)} aria-label={`Use ${c} as primary colour`} aria-pressed={upper === c} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2 font-mono text-2xs ${upper === c ? "border-brand text-ink" : "border-border text-muted hover:text-ink"}`}><Swatch value={c} className="h-3 w-3" />{c}</button>)}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input error={shown("typeface")} hint={s.fonts.length > 1 ? `Also found: ${s.fonts.slice(1, 4).join(", ")}` : undefined} name="typeface" onChange={set("typeface")} placeholder="e.g. Inter" title="Typeface" value={v.typeface} />
        <Input error={shown("buttonRadius")} name="buttonRadius" onChange={set("buttonRadius")} placeholder="e.g. 8px" title="Button corner radius" value={v.buttonRadius} />
      </div>
      <Input error={shown("voice")} name="voice" onChange={set("voice")} placeholder="e.g. Friendly and direct" title="Tone of voice (optional)" value={v.voice} />
    </fieldset>

    <fieldset className="space-y-3 rounded-card border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Old values to replace</legend>
      <p className={help}>Values from your old brand that may still be in your files. Markpath finds them and suggests your new ones. Leave any blank to skip it.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input error={shown("previousColour")} name="previousColour" onChange={set("previousColour")} placeholder="e.g. #0B57D0" swatch title="Old colour" value={v.previousColour} />
        <Input error={shown("previousTypeface")} name="previousTypeface" onChange={set("previousTypeface")} placeholder="e.g. Arial" title="Old typeface" value={v.previousTypeface} />
        <Input error={shown("previousRadius")} name="previousRadius" onChange={set("previousRadius")} placeholder="e.g. 4px" title="Old corner radius" value={v.previousRadius} />
      </div>
    </fieldset>

    <input type="hidden" name="version" value={s.version ?? ""} />
    {generalError && <Notice tone="danger" role="alert">{generalError}</Notice>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <a className={buttonClass("ghost")} href={restartHref}>{restartLabel}</a>
      <SubmitButton className={buttonClass("primary")} pendingLabel="Saving…">Save brand rules</SubmitButton>
    </div>
  </form>;
}
