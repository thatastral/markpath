import type { ReactNode } from "react";
import { ExternalIcon } from "@/components/ui/icons";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** A link to another site. Opens in a new tab and says so in visible text. */
export function SetupExternalLink({ href, children, button = false }: { href: string; children: ReactNode; button?: boolean }) {
  const style = button
    ? `inline-flex min-h-10 items-center gap-1.5 rounded-control border border-border-strong bg-surface px-3 py-2 text-sm font-medium shadow-card hover:bg-subtle ${focus}`
    : `inline-flex min-h-10 items-center gap-1 font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand ${focus}`;
  return <a className={style} href={href} rel="noopener noreferrer" target="_blank">{children}<ExternalIcon className="shrink-0 opacity-70" size={14} /><span className="sr-only">(opens in a new tab)</span></a>;
}
