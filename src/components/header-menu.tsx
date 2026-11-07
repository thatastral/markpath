"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Below `sm` the nav and account controls sit behind a Menu button; from `sm` up they show inline. */
export function HeaderMenu({ children }: Readonly<{ children: React.ReactNode }>) {
  const path = usePathname(); const id = useId(); const button = useRef<HTMLButtonElement>(null);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path; // closes by itself after navigating to another page
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenAt(null); button.current?.focus(); } };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return <>
    <button aria-controls={id} aria-expanded={open} className="ml-auto rounded-[var(--radius-control)] border border-border px-3 py-1.5 text-sm font-medium sm:hidden" onClick={() => setOpenAt(open ? null : path)} ref={button} type="button">Menu</button>
    <div className={`${open ? "flex" : "hidden"} w-full flex-col gap-4 border-t border-border pt-3 sm:flex sm:w-auto sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:border-0 sm:pt-0`} id={id}>{children}</div>
  </>;
}
