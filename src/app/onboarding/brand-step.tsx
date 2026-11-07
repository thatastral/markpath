"use client";
import { useActionState, useRef, useState, type KeyboardEvent } from "react";
import { buttonClass, inputClass, Notice, Swatch } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDrop, UrlInput } from "@/components/ui/file-drop";
import { confirmBrand, readGuideline, type ReadState } from "./actions";

const sources = [
  { id: "file", label: "File", hint: "PDF, Markdown or text" },
  { id: "website", label: "Website", hint: "Your site's address" },
  { id: "design", label: "Figma or Canva", hint: "A design link" },
] as const;
type Source = (typeof sources)[number]["id"];

const label = "text-xs font-medium text-ink";
const help = "text-xs text-muted";

export function BrandStep() {
  const [source, setSource] = useState<Source>("file");
  const [read, readAction] = useActionState<ReadState, FormData>(readGuideline, {});
  const [confirm, confirmAction] = useActionState(confirmBrand, {});
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const s = read.suggestion;

  if (s) return <ReviewForm key={read.sourceName} read={read} action={confirmAction} error={confirm.error} />;

  // Arrow keys, Home and End move between the source tabs (WAI-ARIA tabs pattern).
  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = sources.findIndex((o) => o.id === source);
    const to = e.key === "ArrowRight" ? (i + 1) % sources.length : e.key === "ArrowLeft" ? (i - 1 + sources.length) % sources.length : e.key === "Home" ? 0 : e.key === "End" ? sources.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault(); setSource(sources[to].id); tabs.current[to]?.focus();
  }

  return <div className="space-y-5">
    <div role="tablist" aria-label="Where are your brand rules?" className="grid grid-cols-3 gap-1 rounded-control bg-hover p-1" onKeyDown={onTabKey}>
      {sources.map((o, i) => <button key={o.id} ref={(el) => { tabs.current[i] = el; }} id={`source-${o.id}`} role="tab" aria-selected={source === o.id} aria-controls="source-panel" tabIndex={source === o.id ? 0 : -1} type="button" onClick={() => setSource(o.id)} className={`press min-h-10 rounded-[6px] px-2 text-sm font-medium lg:min-h-8 ${source === o.id ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted hover:text-ink"}`}>{o.label}</button>)}
    </div>
    <form action={readAction} aria-labelledby={`source-${source}`} className="space-y-3" id="source-panel" key={source} role="tabpanel">
      <input type="hidden" name="kind" value={source === "file" ? "file" : "link"} />
      {source === "file" ? <div className="space-y-1.5">
        <label className={label} htmlFor="brand-file">Brand guideline</label>
        <FileDrop accept=".pdf,.md,.markdown,.txt" autoFocus hint="PDF, Markdown or text, up to 10 MB." id="brand-file" maxBytes={10_000_000} name="file" required />
      </div> : <div className="space-y-1.5">
        <label className={label} htmlFor="brand-link">{source === "website" ? "Website address" : "Figma or Canva link"}</label>
        <UrlInput site={source === "design" ? "design" : undefined} id="brand-link" key={source} name="link" placeholder={source === "website" ? "https://yourcompany.com" : "https://www.figma.com/design/…"} required />
        <span className={`block ${help}`}>{source === "website" ? "Markpath reads its colours and fonts. Nothing on your site changes." : "Markpath saves this design to check later. You add your rules on the next screen."}</span>
      </div>}
      {read.error && <Notice tone="danger" role="alert">{read.error}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton className={buttonClass("primary")} pendingLabel="Reading…">{source === "file" ? "Read file" : source === "website" ? "Read website" : "Save link"}</SubmitButton>
      </div>
    </form>
    <form action={readAction} className="border-t border-border pt-4">
      <input type="hidden" name="kind" value="sample" />
      <p className={`${help} flex flex-wrap items-center gap-x-1`}>No guideline handy? <SubmitButton className="inline-flex min-h-10 items-center font-medium text-brand hover:underline lg:min-h-6" pendingLabel="Loading sample…">Try a sample brand</SubmitButton></p>
    </form>
  </div>;
}

function Field({ name, title, hint, value, placeholder, swatch }: { name: string; title: string; hint?: string; value?: string; placeholder?: string; swatch?: boolean }) {
  const [v, setV] = useState(value ?? "");
  return <label className="block min-w-0 space-y-1.5">
    <span className={label}>{title}</span>
    <span className="flex items-center gap-2">
      {swatch && <Swatch value={/^#[0-9a-fA-F]{6}$/.test(v) ? v : "#FFFFFF"} className="h-8 w-8 shrink-0" />}
      <input className={inputClass} name={name} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} />
    </span>
    {hint && <span className={help}>{hint}</span>}
  </label>;
}

function ReviewForm({ read, action, error }: { read: ReadState; action: (f: FormData) => void; error?: string }) {
  const s = read.suggestion!;
  const [primary, setPrimary] = useState(s.primaryColour ?? "");
  return <form action={action} className="space-y-5">
    <input type="hidden" name="kind" value={read.kind ?? "manual"} />
    <input type="hidden" name="sourceName" value={read.sourceName ?? ""} />
    {read.note && <Notice tone={s.found.length ? "success" : "neutral"} role="status">{read.note}</Notice>}

    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">Your brand rules</legend>
      <label className="block space-y-1.5">
        <span className={label}>Primary colour</span>
        <span className="flex items-center gap-2">
          <Swatch value={/^#[0-9a-fA-F]{6}$/.test(primary) ? primary : "#FFFFFF"} className="h-8 w-8 shrink-0" />
          <input className={inputClass} name="primaryColour" value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="#2457F5" required autoComplete="off" spellCheck={false} autoFocus />
        </span>
        {s.colours.length > 1 && <span className="flex flex-wrap items-center gap-1.5 pt-1"><span className={help}>Found in your source:</span>{s.colours.slice(0, 6).map((c) => <button key={c} type="button" onClick={() => setPrimary(c)} aria-label={`Use ${c}`} aria-pressed={primary.toUpperCase() === c} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2 font-mono text-2xs ${primary.toUpperCase() === c ? "border-brand text-ink" : "border-border text-muted hover:text-ink"}`}><Swatch value={c} className="h-3 w-3" />{c}</button>)}</span>}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="typeface" title="Typeface" value={s.typeface} placeholder="Geist" hint={s.fonts.length > 1 ? `Also found: ${s.fonts.slice(1, 4).join(", ")}` : undefined} />
        <Field name="buttonRadius" title="Button corner radius" value={s.buttonRadius} placeholder="8px" />
      </div>
      <Field name="voice" title="Tone of voice (optional)" value={s.voice} placeholder="Clear, calm and direct." />
    </fieldset>

    <fieldset className="space-y-3 rounded-card border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Old values to replace</legend>
      <p className={help}>Values from your old brand that may still be in your files. Markpath finds them and suggests your new ones. Leave any blank to skip it.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="previousColour" title="Old colour" value={s.previousColour} placeholder="#164B9B" swatch />
        <Field name="previousTypeface" title="Old typeface" value={s.previousTypeface} placeholder="Inter" />
        <Field name="previousRadius" title="Old corner radius" value={s.previousRadius} placeholder="4px" />
      </div>
    </fieldset>

    <input type="hidden" name="version" value={s.version ?? ""} />
    {error && <Notice tone="danger" role="alert">{error}</Notice>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <a className={buttonClass("ghost")} href="/onboarding?step=brand">Start over</a>
      <SubmitButton className={buttonClass("primary")} pendingLabel="Saving…">Save brand rules</SubmitButton>
    </div>
  </form>;
}
