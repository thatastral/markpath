"use client";
import { forwardRef, useState, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon, AlertIcon } from "@/components/ui/icons";
import { inputClass } from "@/components/ui/primitives";

/**
 * Standard form field (Stripe / Linear pattern): visible label bound with htmlFor, optional hint,
 * inline error under the input wired with aria-describedby + aria-invalid.
 */
export function Field({ id, label, hint, error, children, optional = false, action }: { id: string; label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; optional?: boolean; action?: ReactNode }) {
  return <div className="grid gap-1.5">
    <div className="flex items-baseline justify-between gap-2"><label className="text-xs font-medium text-muted" htmlFor={id}>{label}{optional && <span className="font-normal"> (optional)</span>}</label>{action}</div>
    {children}
    {hint && !error && <p className="text-xs text-muted" id={`${id}-hint`}>{hint}</p>}
    {error && <p className="anim-rise flex items-start gap-1.5 text-xs text-danger" id={`${id}-error`}><AlertIcon className="mt-px shrink-0" size={13} />{error}</p>}
  </div>;
}

/** aria props for an input inside <Field>. */
export const fieldAria = (id: string, error?: string, hint?: boolean) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

const field = `${inputClass} lg:min-h-9`;

/** Text input with the standard field styling and an error border. */
export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function TextInput({ invalid, className = "", ...rest }, ref) {
  return <input className={`${field} ${invalid ? "border-danger" : ""} ${className}`} ref={ref} {...rest} />;
});

/**
 * Password input with a show/hide eye toggle (keeps focus in place) and a Caps Lock hint.
 * The toggle is a real button: aria-pressed and a label that says what it will do.
 */
export function PasswordInput({ id, invalid, describedBy, ...rest }: InputHTMLAttributes<HTMLInputElement> & { id: string; invalid?: boolean; describedBy?: string }) {
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return <div className="grid gap-1.5">
    <div className="relative">
      <input {...rest} aria-describedby={[describedBy, caps ? `${id}-caps` : ""].filter(Boolean).join(" ") || undefined} aria-invalid={invalid || undefined} autoCapitalize="none" className={`${field} pr-10 ${invalid ? "border-danger" : ""}`} id={id} onBlur={() => setCaps(false)} onKeyDown={onKey} onKeyUp={onKey} spellCheck={false} type={shown ? "text" : "password"} />
      <button aria-controls={id} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-control text-muted hover:text-ink" onClick={() => setShown((s) => !s)} onMouseDown={(e) => e.preventDefault()} type="button">{shown ? <EyeOffIcon /> : <EyeIcon />}</button>
    </div>
    {caps && <p className="text-xs text-warning" id={`${id}-caps`} role="status">Caps Lock is on.</p>}
  </div>;
}

/** Simple submit-time checks, so errors show next to the field instead of a browser bubble. */
export const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export function looksLikeUrl(v: string, host?: RegExp) {
  try { const u = new URL(/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`); return /\./.test(u.hostname) && (!host || host.test(u.hostname)); } catch { return false; }
}
