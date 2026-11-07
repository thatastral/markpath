"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<[string, string]> = [["Brand profile", "/brand"], ["Integrations", "/integrations"], ["Issues & approvals", "/issues"], ["Reviews", "/reviews"], ["Activity", "/activity"]];
export function MainNav() {
  const path = usePathname();
  return <nav aria-label="Main" className="flex flex-wrap items-center gap-x-4 gap-y-1"><Link aria-current={path === "/" ? "page" : undefined} className="font-semibold" href="/">Markpath</Link>{links.map(([label, href]) => { const on = path === href || path.startsWith(`${href}/`); return <Link aria-current={on ? "page" : undefined} className={`py-1 text-sm ${on ? "font-semibold underline underline-offset-4" : "text-muted underline"}`} href={href} key={href}>{label}</Link>; })}</nav>;
}
