"use client";
import { useRef, useState, type DragEvent } from "react";
import { AlertIcon, UploadIcon } from "@/components/ui/icons";
import { inputClass } from "@/components/ui/primitives";
import { looksLikeUrl } from "@/components/ui/form-field";

const sizeText = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/**
 * Drop zone for one file (incident.io / WeTransfer pattern): drag a file in or click to browse.
 * Shows the chosen file's name and size; checks type and size before upload. The real <input type=file>
 * stays in the form (same name), visually hidden but focusable, so keyboard and forms work as normal.
 */
export function FileDrop({ id, name, accept, maxBytes, hint, required = false, autoFocus = false }: { id: string; name: string; accept: string; maxBytes: number; hint: string; required?: boolean; autoFocus?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string>();
  const exts = accept.split(",").map((a) => a.trim().toLowerCase());
  function take(f: File | null) {
    setError(undefined);
    if (!f) { setFile(null); return; }
    const ok = exts.some((a) => (a.startsWith(".") ? f.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? f.type.startsWith(a.slice(0, -1)) : f.type === a));
    if (!ok) { setFile(null); if (input.current) input.current.value = ""; setError(`That file type isn't supported. ${hint}`); return; }
    if (f.size > maxBytes) { setFile(null); if (input.current) input.current.value = ""; setError(`That file is ${sizeText(f.size)}. The limit is ${sizeText(maxBytes)}.`); return; }
    setFile(f);
  }
  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files?.[0]; if (!f || !input.current) return;
    const dt = new DataTransfer(); dt.items.add(f); input.current.files = dt.files; take(f);
  }
  return <div className="grid gap-1.5">
    <label className={`dropzone flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-card border border-dashed px-4 py-4 text-center text-sm ${error ? "border-danger" : over ? "border-brand bg-brand-soft" : "border-border-strong bg-subtle hover:bg-hover"}`} htmlFor={id} onDragLeave={() => setOver(false)} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDrop={onDrop}>
      <input accept={accept} aria-describedby={`${id}-status`} aria-invalid={error ? true : undefined} className="sr-only" data-autofocus={autoFocus || undefined} id={id} name={name} onChange={(e) => take(e.target.files?.[0] ?? null)} onInvalid={(e) => { e.preventDefault(); setError("Choose a file first."); }} ref={input} required={required} type="file" />
      <UploadIcon className={over ? "text-brand" : "text-muted"} />
      {file
        ? <span className="flex max-w-full flex-wrap items-baseline justify-center gap-x-2"><span className="min-w-0 truncate font-medium" title={file.name}>{file.name}</span><span className="text-xs tabular-nums text-muted">{sizeText(file.size)}</span></span>
        : <span><span className="font-medium text-brand">Choose a file</span> <span className="text-muted">or drag it here</span></span>}
      <span className="text-xs text-muted" id={`${id}-status`}>{file ? "Click to choose another file." : hint}</span>
    </label>
    {error && <p className="anim-rise flex items-start gap-1.5 text-xs text-danger" role="alert"><AlertIcon className="mt-px shrink-0" size={13} />{error}</p>}
  </div>;
}

/**
 * Link field that checks the address on submit (and on leaving the field), showing the error inline
 * instead of a browser bubble. Accepts links without https://. Empty is fine unless `required`.
 */
const HOSTS = { figma: [/(^|\.)figma\.com$/i, "Figma"], canva: [/(^|\.)canva\.com$/i, "Canva"], design: [/(^|\.)(figma|canva)\.com$/i, "Figma or Canva"] } as const;

export function UrlInput({ id, name, placeholder, defaultValue, site, required = false, autoFocus = false, className = "" }: { id: string; name: string; placeholder?: string; defaultValue?: string; site?: keyof typeof HOSTS; required?: boolean; autoFocus?: boolean; className?: string }) {
  const [host, hostName] = site ? HOSTS[site] : [undefined, undefined];
  const [error, setError] = useState<string>();
  const message = (v: string) => (!v.trim() ? (required ? "Paste a link first." : "") : looksLikeUrl(v, host) ? "" : hostName ? `Paste a ${hostName} link, like ${placeholder ?? "https://…"}` : "Paste a full web address, like https://yourcompany.com");
  const check = (el: HTMLInputElement) => { const m = message(el.value); el.setCustomValidity(m); return m; };
  return <span className={`grid min-w-0 gap-1 ${className}`}>
    <input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error ? true : undefined} autoCapitalize="none" autoComplete="url" className={`${inputClass} ${error ? "border-danger" : ""}`} data-autofocus={autoFocus || undefined} defaultValue={defaultValue} id={id} inputMode="url" name={name} onBlur={(e) => { const m = check(e.currentTarget); setError(m || undefined); }} onChange={(e) => { check(e.currentTarget); if (error) setError(undefined); }} onInvalid={(e) => { e.preventDefault(); setError(check(e.currentTarget) || undefined); }} placeholder={placeholder} ref={(el) => { if (el) check(el); }} required={required} spellCheck={false} type="text" />
    {error && <span className="anim-rise flex items-start gap-1.5 text-xs text-danger" id={`${id}-error`} role="alert"><AlertIcon className="mt-px shrink-0" size={13} />{error}</span>}
  </span>;
}
