"use client";
import { useActionState, useState } from "react";
import { buttonClass, inputClass, Notice, Swatch } from "@/components/ui/primitives";
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
  const [read, readAction, reading] = useActionState<ReadState, FormData>(readGuideline, {});
  const [confirm, confirmAction, saving] = useActionState(confirmBrand, {});
  const s = read.suggestion;

  if (s) return <ReviewForm key={read.sourceName} read={read} action={confirmAction} saving={saving} error={confirm.error} />;

  return <div className="space-y-5">
    <div role="tablist" aria-label="Where your brand rules are" className="grid grid-cols-3 gap-1 rounded-control bg-hover p-1">
      {sources.map((o) => <button key={o.id} role="tab" aria-selected={source === o.id} type="button" onClick={() => setSource(o.id)} className={`min-h-10 rounded-[6px] px-2 text-sm font-medium transition-colors duration-[var(--duration-short)] lg:min-h-8 ${source === o.id ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted hover:text-ink"}`}>{o.label}</button>)}
    </div>
    <form action={readAction} className="space-y-3" key={source}>
      <input type="hidden" name="kind" value={source === "file" ? "file" : "link"} />
      {source === "file" ? <label className="block space-y-1.5">
        <span className={label}>Brand guideline</span>
        <input className={`${inputClass} file:mr-3 file:rounded-[5px] file:border-0 file:bg-hover file:px-2.5 file:py-1 file:text-sm file:font-medium`} type="file" name="file" accept=".pdf,.md,.markdown,.txt" required />
        <span className={help}>PDF, Markdown or text, up to 10 MB.</span>
      </label> : <label className="block space-y-1.5">
        <span className={label}>{source === "website" ? "Website address" : "Figma or Canva link"}</span>
        <input className={inputClass} type="url" inputMode="url" name="link" required placeholder={source === "website" ? "https://yourcompany.com" : "https://www.figma.com/design/…"} />
        <span className={help}>{source === "website" ? "We read its colours and fonts. Nothing is changed." : "We'll also check this file for off-brand values later."}</span>
      </label>}
      {read.error && <Notice tone="danger" role="alert">{read.error}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonClass("primary")} disabled={reading} type="submit">{reading ? "Reading…" : source === "file" ? "Read file" : source === "website" ? "Read website" : "Use this link"}</button>
      </div>
    </form>
    <form action={readAction} className="border-t border-border pt-4">
      <input type="hidden" name="kind" value="sample" />
      <p className={help}>No guideline to hand? <button className="font-medium text-brand hover:underline" type="submit">Use a sample brand</button></p>
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

function ReviewForm({ read, action, saving, error }: { read: ReadState; action: (f: FormData) => void; saving: boolean; error?: string }) {
  const s = read.suggestion!;
  const [primary, setPrimary] = useState(s.primaryColour ?? "");
  return <form action={action} className="space-y-5">
    <input type="hidden" name="kind" value={read.kind ?? "manual"} />
    <input type="hidden" name="sourceName" value={read.sourceName ?? ""} />
    {read.note && <Notice tone={s.found.length ? "success" : "neutral"} role="status">{read.note}</Notice>}

    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">Your brand today</legend>
      <label className="block space-y-1.5">
        <span className={label}>Primary colour</span>
        <span className="flex items-center gap-2">
          <Swatch value={/^#[0-9a-fA-F]{6}$/.test(primary) ? primary : "#FFFFFF"} className="h-8 w-8 shrink-0" />
          <input className={inputClass} name="primaryColour" value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="#2457F5" required autoComplete="off" spellCheck={false} />
        </span>
        {s.colours.length > 1 && <span className="flex flex-wrap items-center gap-1.5 pt-1"><span className={help}>Found:</span>{s.colours.slice(0, 6).map((c) => <button key={c} type="button" onClick={() => setPrimary(c)} aria-label={`Use ${c}`} aria-pressed={primary.toUpperCase() === c} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2 font-mono text-2xs ${primary.toUpperCase() === c ? "border-brand text-ink" : "border-border text-muted hover:text-ink"}`}><Swatch value={c} className="h-3 w-3" />{c}</button>)}</span>}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="typeface" title="Typeface" value={s.typeface} placeholder="Geist" hint={s.fonts.length > 1 ? `Also found: ${s.fonts.slice(1, 4).join(", ")}` : undefined} />
        <Field name="buttonRadius" title="Button corner radius" value={s.buttonRadius} placeholder="8px" />
      </div>
      <Field name="voice" title="Voice (optional)" value={s.voice} placeholder="Clear, calm and direct." />
    </fieldset>

    <fieldset className="space-y-3 rounded-card border border-border p-4">
      <legend className="px-1 text-sm font-semibold">What should Markpath replace?</legend>
      <p className={help}>The old values still in your files. Markpath finds these and proposes the new ones. Leave any blank to skip it.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field name="previousColour" title="Old colour" value={s.previousColour} placeholder="#164B9B" swatch />
        <Field name="previousTypeface" title="Old typeface" value={s.previousTypeface} placeholder="Inter" />
        <Field name="previousRadius" title="Old radius" value={s.previousRadius} placeholder="4px" />
      </div>
    </fieldset>

    <input type="hidden" name="version" value={s.version ?? ""} />
    {error && <Notice tone="danger" role="alert">{error}</Notice>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <a className={buttonClass("ghost")} href="/onboarding?step=brand">Start over</a>
      <button className={buttonClass("primary")} disabled={saving} type="submit">{saving ? "Saving…" : "Save brand rules"}</button>
    </div>
  </form>;
}
