"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<[string, string]> = [["Brand profile", "/brand"], ["Integrations", "/integrations"], ["Issues & approvals", "/issues"], ["Reviews", "/reviews"], ["Activity", "/activity"]];

export function Logo() {
  return <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-solid text-white shadow-card">
    <svg fill="none" height="16" viewBox="0 0 24 24" width="16"><path d="M4 18V6l5 7 5-7v12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" /><circle cx="19" cy="17" fill="currentColor" r="2" /></svg>
  </span>;
}

export function HomeLink() {
  const path = usePathname();
  return <Link aria-current={path === "/" ? "page" : undefined} className="-ml-1 inline-flex min-h-10 items-center gap-2 rounded-control px-1 font-semibold tracking-tight" href="/"><Logo />Markpath</Link>;
}

export function MainNav() {
  const path = usePathname();
  return <nav aria-label="Main" className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1">{links.map(([label, href]) => {
    const on = path === href || path.startsWith(`${href}/`);
    return <Link aria-current={on ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-control px-3 text-sm font-medium sm:min-h-9 ${on ? "bg-subtle text-ink" : "text-muted hover:bg-subtle hover:text-ink"}`} href={href} key={href}>{label}</Link>;
  })}</nav>;
}
