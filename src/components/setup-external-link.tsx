import type { ReactNode } from "react";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** A link to another site. Opens in a new tab and says so in visible text. */
export function SetupExternalLink({ href, children, button = false }: { href: string; children: ReactNode; button?: boolean }) {
  const style = button
    ? `inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm font-medium ${focus}`
    : `inline-flex min-h-10 items-center font-medium text-brand underline ${focus}`;
  return <a className={style} href={href} rel="noopener noreferrer" target="_blank">{children}<span className="ml-1 text-xs font-normal text-muted">(opens in a new tab)</span></a>;
}
