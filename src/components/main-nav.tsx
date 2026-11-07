"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<[string, string]> = [["Brand profile", "/brand"], ["Integrations", "/integrations"], ["Issues & approvals", "/issues"], ["Reviews", "/reviews"], ["Activity", "/activity"]];

export function HomeLink() {
  const path = usePathname();
  return <Link aria-current={path === "/" ? "page" : undefined} className="py-1 font-semibold" href="/">Markpath</Link>;
}

export function MainNav() {
  const path = usePathname();
  return <nav aria-label="Main" className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">{links.map(([label, href]) => { const on = path === href || path.startsWith(`${href}/`); return <Link aria-current={on ? "page" : undefined} className={`py-2 text-sm sm:py-1 ${on ? "font-semibold underline underline-offset-4" : "text-muted underline"}`} href={href} key={href}>{label}</Link>; })}</nav>;
}
