"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";
import { THEME_COOKIE, type Theme } from "./theme";

const options: Array<{ id: Theme; label: string; icon: React.ReactNode }> = [
  { id: "system", label: "System", icon: <MonitorIcon size={14} /> },
  { id: "light", label: "Light", icon: <SunIcon size={14} /> },
  { id: "dark", label: "Dark", icon: <MoonIcon size={14} /> },
];

/**
 * System / Light / Dark segmented control. Applies instantly on <html data-theme> and saves a cookie,
 * so the server renders the same theme next time (no flash). Arrow keys move between options.
 */
export function ThemeSwitcher({ initial, className = "" }: { initial: Theme; className?: string }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = options.findIndex((o) => o.id === theme);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % options.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + options.length) % options.length : -1;
    if (to < 0) return;
    e.preventDefault(); choose(options[to].id); refs.current[to]?.focus();
  }
  return <div aria-label="Theme" className={`inline-grid grid-cols-3 gap-0.5 rounded-control border border-border bg-subtle p-0.5 ${className}`} onKeyDown={onKey} role="radiogroup">
    {options.map((o, i) => { const on = o.id === theme; return <button aria-checked={on} className={`press inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[5px] px-2 text-xs font-medium lg:min-h-7 ${on ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-border-strong)]" : "text-muted hover:text-ink"}`} key={o.id} onClick={() => choose(o.id)} ref={(el) => { refs.current[i] = el; }} role="radio" tabIndex={on ? 0 : -1} title={`${o.label} theme`} type="button">{o.icon}<span className="theme-label">{o.label}</span></button>; })}
  </div>;
}
