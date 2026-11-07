"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActivityIcon, BrandIcon, EyeCheckIcon, HomeIcon, InboxIcon, PlugIcon } from "@/components/ui/icons";

const links: Array<[string, string, ReactNode]> = [
  ["Overview", "/", <HomeIcon key="i" />],
  ["Issues & approvals", "/issues", <InboxIcon key="i" />],
  ["Brand", "/brand", <BrandIcon key="i" />],
  ["Reviews", "/reviews", <EyeCheckIcon key="i" />],
  ["Activity", "/activity", <ActivityIcon key="i" />],
  ["Integrations", "/integrations", <PlugIcon key="i" />],
];

/** The Markpath mark: a path that ends in a checked point, on an ink tile. */
export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "md" ? "h-6 w-6" : "h-5 w-5";
  return <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-[6px] bg-ink text-surface ${dims}`}>
    <svg fill="none" height="70%" viewBox="0 0 24 24" width="70%"><path d="M4 17.5l5-6 4 3.5 6.5-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" /><circle cx="19.5" cy="7" fill="currentColor" r="2.6" /></svg>
  </span>;
}

export function HomeLink() {
  const path = usePathname();
  return <Link aria-current={path === "/" ? "page" : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-control px-1 text-sm font-semibold tracking-tight" href="/"><Logo />Markpath</Link>;
}

/** Linear-style sidebar navigation: icon + label rows, the current page tinted, a count on Issues when approvals wait. */
export function MainNav({ pending = 0 }: { pending?: number }) {
  const path = usePathname();
  return <nav aria-label="Main" className="grid gap-px">{links.map(([label, href, icon]) => {
    const on = href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
    return <Link aria-current={on ? "page" : undefined} className={`group flex min-h-10 items-center gap-2.5 rounded-control px-2 text-sm lg:min-h-8 ${on ? "bg-hover font-medium text-ink" : "text-ink/85 hover:bg-hover hover:text-ink"}`} href={href} key={href}>
      <span aria-hidden className={on ? "text-ink" : "text-muted group-hover:text-ink"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {href === "/issues" && pending > 0 && <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-solid px-1.5 text-2xs font-semibold tabular-nums text-white">{pending}<span className="sr-only"> waiting for approval</span></span>}
    </Link>;
  })}</nav>;
}
