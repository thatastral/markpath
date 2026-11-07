"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** The sidebar workspace menu. A native <details>, closed by Escape (focus back on the trigger), a click outside, or navigating. */
export function WorkspaceMenu({ summary, children, className = "" }: { summary: ReactNode; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => { if (ref.current) ref.current.open = false; }, [path]);
  useEffect(() => {
    const close = (focus: boolean) => { const d = ref.current; if (!d?.open) return; d.open = false; if (focus) d.querySelector("summary")?.focus(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && ref.current?.open) { e.stopPropagation(); close(true); } };
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(false); };
    document.addEventListener("keydown", onKey, true); document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", onDown); };
  }, []);
  return <details className={className} ref={ref}>
    {summary}
    <div onClick={(e) => { if ((e.target as HTMLElement).closest("a")) ref.current?.removeAttribute("open"); }}>{children}</div>
  </details>;
}

/** Sends the current page with the switch, so switching workspace keeps you on Issues, Brand and so on. */
export function CurrentPathInput() {
  return <input name="next" type="hidden" value={usePathname()} />;
}
