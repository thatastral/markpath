"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon, SidebarIcon } from "@/components/ui/icons";
import { Logo } from "@/components/main-nav";

/**
 * App shell. lg+: fixed warm-grey left sidebar and a flush white canvas (Attio).
 * Below lg: a compact top bar with a Menu button that opens the same sidebar as a drawer.
 * Escape closes it and returns focus to the button; navigating closes it.
 */
export const SIDEBAR_COOKIE = "mp-sidebar";

export function AppShell({ sidebar, workspace, workspaceInitial, collapsedInitial = false, children }: Readonly<{ sidebar: React.ReactNode; workspace?: string; workspaceInitial?: string; collapsedInitial?: boolean; children: React.ReactNode }>) {
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
  // Desktop: collapse the sidebar to icons. Saved in a cookie so the server renders it the same way. Press [ to toggle.
  const [collapsed, setCollapsed] = useState(collapsedInitial);
  const toggle = () => setCollapsed((c) => { document.cookie = `${SIDEBAR_COOKIE}=${c ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`; return !c; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      if (window.matchMedia("(min-width: 1024px)").matches) { e.preventDefault(); toggle(); }
    };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  return <>
    <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-surface px-2 lg:hidden">
      <button aria-controls={id} aria-expanded={open} className="press inline-flex min-h-10 items-center gap-2 rounded-control px-2.5 text-sm font-medium text-ink hover:bg-hover" onClick={() => setOpenAt(open ? null : path)} ref={button} type="button"><MenuIcon />Menu</button>
      <span className="ml-auto flex min-w-0 items-center gap-2 pr-2 text-sm font-medium">{workspace ? <span aria-hidden className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-brand-solid text-2xs font-semibold text-on-brand">{workspaceInitial ?? workspace.trim().charAt(0).toUpperCase()}</span> : <Logo size="sm" />}<span className="truncate" title={workspace ?? "Markpath"}>{workspace ?? "Markpath"}</span></span>
    </div>
    {open && <div aria-hidden className="anim-fade fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={shut} />}
    <aside className={`${open ? "anim-slide flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] flex-col border-r border-border bg-canvas shadow-pop lg:flex lg:border-0 lg:shadow-none lg:[animation:none] ${collapsed ? "lg:w-14" : "lg:w-60"}`} data-collapsed={collapsed} id={id}>
      <button aria-label="Close menu" className="absolute right-2 top-2 inline-flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-hover hover:text-ink lg:hidden" onClick={shut} ref={close} type="button"><CloseIcon /></button>
      <div className="flex min-h-0 flex-1 flex-col">{sidebar}</div>
      <div className="hidden border-t border-border px-2 py-2 lg:block">
        <button aria-expanded={!collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="press flex min-h-8 w-full items-center gap-2 rounded-control px-2 text-sm text-muted hover:bg-hover hover:text-ink" onClick={toggle} title={`${collapsed ? "Expand" : "Collapse"} sidebar ( [ )`} type="button"><SidebarIcon className="shrink-0" /><span className="sb-text">Collapse</span><kbd className="sb-text ml-auto rounded border border-border px-1 font-mono text-2xs text-muted">[</kbd></button>
      </div>
    </aside>
    <div className={collapsed ? "lg:pl-14" : "lg:pl-60"}>
      <div className="min-h-[calc(100dvh-3rem)] bg-surface lg:min-h-dvh lg:border-l lg:border-border">{children}</div>
    </div>
  </>;
}
