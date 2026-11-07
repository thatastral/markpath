"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { Logo } from "@/components/main-nav";

/**
 * App shell. lg+: fixed warm-grey left sidebar and a flush white canvas (Attio).
 * Below lg: a compact top bar with a Menu button that opens the same sidebar as a drawer.
 * Escape closes it and returns focus to the button; navigating closes it.
 */
export function AppShell({ sidebar, workspace, children }: Readonly<{ sidebar: React.ReactNode; workspace?: string; children: React.ReactNode }>) {
  const path = usePathname(); const id = useId(); const button = useRef<HTMLButtonElement>(null); const close = useRef<HTMLButtonElement>(null);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path; // closes by itself after navigating to another page
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenAt(null); button.current?.focus(); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const shut = () => { setOpenAt(null); button.current?.focus(); };
  return <>
    <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-surface px-2 lg:hidden">
      <button aria-controls={id} aria-expanded={open} className="press inline-flex min-h-10 items-center gap-2 rounded-control px-2.5 text-sm font-medium text-ink hover:bg-hover" onClick={() => setOpenAt(open ? null : path)} ref={button} type="button"><MenuIcon />Menu</button>
      <span className="ml-auto flex min-w-0 items-center gap-2 pr-2 text-sm font-medium"><Logo size="sm" /><span className="truncate" title={workspace ?? "Markpath"}>{workspace ?? "Markpath"}</span></span>
    </div>
    {open && <div aria-hidden className="anim-fade fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={shut} />}
    <aside className={`${open ? "anim-slide flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] flex-col border-r border-border bg-canvas shadow-pop lg:flex lg:w-60 lg:border-0 lg:shadow-none lg:[animation:none]`} id={id}>
      <button aria-label="Close menu" className="absolute right-2 top-2 inline-flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-hover hover:text-ink lg:hidden" onClick={shut} ref={close} type="button"><CloseIcon /></button>
      {sidebar}
    </aside>
    <div className="lg:pl-60">
      <div className="min-h-[calc(100dvh-3rem)] bg-surface lg:min-h-dvh lg:border-l lg:border-border">{children}</div>
    </div>
  </>;
}
