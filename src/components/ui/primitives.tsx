import type { ReactNode } from "react";

/* Shared Markpath primitives (Linear structure, AirOps calm). Rules: .claude/skills/markpath-design/SKILL.md */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-solid text-on-brand hover:bg-brand-solid-hover",
  secondary: "border border-border-strong bg-surface text-ink hover:bg-hover",
  ghost: "text-muted hover:bg-hover hover:text-ink",
  danger: "border border-border-strong bg-surface text-ink hover:border-danger/50 hover:text-danger",
};

/** Class string for a button-looking element (works on <button>, <a> and <Link>). 40px on touch, 32/28px on desktop. */
export function buttonClass(variant: ButtonVariant = "secondary", size: "md" | "sm" = "md", extra = "") {
  const sizing = size === "md" ? "min-h-10 px-4 lg:min-h-8" : "min-h-10 px-3 lg:min-h-7";
  return `press inline-flex max-w-full select-none items-center justify-center gap-1.5 rounded-full text-center text-sm font-medium leading-5 disabled:opacity-50 ${sizing} ${variants[variant]} ${extra}`.trim();
}

/** A text link in the accent colour with a 40px hit area on touch. */
export const linkClass = "inline-flex min-h-10 items-center gap-1 font-medium text-brand hover:underline hover:underline-offset-4 lg:min-h-8";

/** Text input / select styling. 16px below sm so iOS does not zoom. */
export const inputClass = "w-full min-w-0 rounded-control border border-border-strong bg-surface px-2.5 py-1.5 text-[16px] font-normal leading-5 text-ink placeholder:text-muted hover:border-faint sm:text-sm lg:min-h-8";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger";
const dots: Record<Tone, string> = { neutral: "bg-faint", brand: "bg-brand", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };

/** A Linear-style status pill. The text always carries the meaning; the dot only reinforces it. */
export function Badge({ tone = "neutral", children, dot = true, className = "" }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return <span className={`inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2 text-xs font-medium text-muted ${className}`}>{dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />}{children}</span>;
}

/** A small count next to a label (nav items, group bands, section titles). */
export function Count({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" }) {
  return <span className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-2xs font-medium tabular-nums ${tone === "brand" ? "bg-brand-solid text-on-brand" : "text-muted"}`}>{children}</span>;
}

export const severityTone = (s: string): Tone => (s === "high" || s === "critical" ? "danger" : s === "medium" ? "warning" : "neutral");

export const cardClass = "rounded-card border border-border bg-surface";

export function Card({ children, className = "", as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: "div" | "article" | "section" | "li"; id?: string; "aria-labelledby"?: string; "aria-label"?: string }) {
  return <Tag className={`${cardClass} ${className}`} {...rest}>{children}</Tag>;
}

/** Page body spacing inside the panel. */
export const bodyClass = "w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8";

/** Slim Linear header bar: title, one-line description, actions on the right. `eyebrow` is accepted for compatibility and not shown. */
export function PageHeader({ title, description, actions, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return <header className="border-b border-border">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:min-h-14 lg:px-8">
      <div className="min-w-0 flex-1 basis-64">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 max-w-3xl text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>;
}

/** AirOps-style friendly section header: title, optional count and one muted line; action on the right. */
export function SectionHeading({ id, title, count, description, action }: { id?: string; title: ReactNode; count?: number; description?: ReactNode; action?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
    <div className="min-w-0">
      <h2 className="flex items-center gap-1.5 text-base font-semibold tracking-tight" id={id}>{title}{count !== undefined && <Count>{count}</Count>}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
    </div>
    {action}
  </div>;
}

/** Linear group band: icon, name and count over a list of rows. */
export function GroupBand({ icon, children, count, action, as: Tag = "div" }: { icon?: ReactNode; children: ReactNode; count?: number; action?: ReactNode; as?: "div" | "h2" | "h3" }) {
  return <Tag className="flex min-h-9 items-center gap-2 border-y border-border bg-subtle px-4 text-sm font-medium sm:px-6 lg:px-8">
    {icon && <span aria-hidden className="text-muted">{icon}</span>}<span className="min-w-0 truncate" title={typeof children === "string" ? children : undefined}>{children}</span>{count !== undefined && <span className="tabular-nums text-muted">{count}</span>}
    {action && <span className="ml-auto">{action}</span>}
  </Tag>;
}

/** Row container class for Linear rows (use on <li>). */
export const rowClass = "flex min-h-10 items-start gap-3 border-b border-border px-4 py-2 last:border-b-0 hover:bg-hover sm:px-6 lg:min-h-9 lg:px-8";

/** incident.io-style illustration: a small mock of stacked rows, the front one carrying the icon. */
export function EmptyArt({ icon, label }: { icon?: ReactNode; label?: ReactNode }) {
  return <div aria-hidden className="relative mx-auto h-[78px] w-[176px]">
    <div className="absolute inset-x-8 top-0 h-8 rounded-control border border-border bg-surface opacity-50" />
    <div className="absolute inset-x-4 top-3 h-8 rounded-control border border-border bg-surface opacity-80" />
    <div className="absolute inset-x-0 top-[30px] flex h-12 items-center gap-2.5 rounded-panel border border-border-strong bg-surface px-3 shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hover text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      <span className="grid flex-1 gap-1.5">{label ? <span className="text-left font-mono text-xs text-muted">{label}</span> : <span className="h-1.5 w-3/4 rounded-full bg-hover" />}<span className="h-1.5 w-1/2 rounded-full bg-hover" /></span>
    </div>
  </div>;
}

/** Empty list: illustration, a short title, one line, up to two buttons (primary first). */
export function EmptyState({ icon, title, children, action, framed = false }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; framed?: boolean }) {
  return <div className={`flex flex-col items-center px-6 py-14 text-center ${framed ? cardClass : ""}`}>
    <EmptyArt icon={icon} />
    <p className="mt-5 text-sm font-semibold">{title}</p>
    {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
    {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>;
}

/** Notice line for ?saved= / ?problem= / ?message= feedback. */
export function Notice({ tone = "neutral", children, role }: { tone?: "neutral" | "success" | "danger"; children: ReactNode; role: "status" | "alert" }) {
  const dot = tone === "danger" ? "bg-danger" : tone === "success" ? "bg-success" : "bg-brand";
  const text = tone === "danger" ? "text-danger" : "text-ink";
  return <p className={`anim-rise flex items-start gap-2.5 rounded-control border border-border bg-surface px-3 py-2.5 text-sm ${text}`} role={role}><span aria-hidden className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />{children}</p>;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (v: string | null | undefined): v is string => Boolean(v && HEX.test(v.trim()));

export function Swatch({ value, className = "" }: { value: string; className?: string }) {
  return <span aria-hidden className={`inline-block h-3 w-3 shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] ${className}`} style={{ backgroundColor: value.trim() }} />;
}

/** A raw brand value (colour, font, radius) as a mono pill, with a swatch for colours. */
export function ValuePill({ value, tone = "neutral" }: { value: string; tone?: "neutral" | "old" | "new" }) {
  const style = tone === "old" ? "text-muted line-through decoration-danger/60" : tone === "new" ? "text-ink" : "text-ink";
  return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-[5px] border border-border bg-subtle px-1.5 py-px font-mono text-xs leading-5 ${style}`}>{isHex(value) && <Swatch value={value} />}<span className="min-w-0 break-all">{value}</span></span>;
}

export function ChangeArrow() {
  return <span aria-hidden className="text-faint">→</span>;
}

const AGENTS: Array<[RegExp, string, string]> = [
  [/director/i, "BD", "bg-brand-solid text-on-brand"],
  [/design|figma/i, "DA", "bg-[#8b5cf6] text-white"],
  [/implement|github|audit/i, "IA", "bg-[#d97706] text-white"],
  [/qa/i, "QA", "bg-[#16a34a] text-white"],
];

/** A small identity tile per agent; people get a neutral tile. */
export function AgentAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const human = /^human/i.test(name);
  const hit = human ? undefined : AGENTS.find(([re]) => re.test(name));
  const initials = hit?.[1] ?? name.replace(/^Human:\s*/i, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dims = size === "md" ? "h-5 w-5 text-[9px]" : "h-[18px] w-[18px] text-[8px]";
  return <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ${dims} ${hit?.[2] ?? "bg-hover text-muted ring-1 ring-inset ring-border-strong"}`}>{initials}</span>;
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return <div aria-label={label} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value} className="h-1 w-full overflow-hidden rounded-full bg-hover" role="progressbar">
    <div className={`progress-fill h-full w-full rounded-full ${ratio === 1 ? "bg-success" : "bg-brand-solid"}`} style={{ transform: `scaleX(${ratio})` }} />
  </div>;
}

/** Linear priority bars: 1 to 3 filled. High/critical in danger. */
export function SeverityIcon({ severity, className = "" }: { severity: string; className?: string }) {
  const n = severity === "high" || severity === "critical" ? 3 : severity === "medium" ? 2 : 1;
  const on = n === 3 ? "fill-danger" : "fill-ink";
  return <svg aria-hidden className={`shrink-0 ${className}`} height="16" viewBox="0 0 16 16" width="16">{[0, 1, 2].map((i) => <rect className={i < n ? on : "fill-faint/60"} height={4 + i * 3} key={i} rx="1" width="3" x={2 + i * 4.5} y={12 - i * 3} />)}</svg>;
}

export type StatusKind = "done" | "failed" | "person" | "waiting" | "todo";
/** Linear status circles. */
export function StatusIcon({ kind, className = "" }: { kind: StatusKind; className?: string }) {
  const cls = `shrink-0 ${className}`;
  switch (kind) {
    case "done": return <svg aria-hidden className={`${cls} text-success`} height="16" viewBox="0 0 16 16" width="16"><circle cx="8" cy="8" fill="currentColor" r="6.5" /><path d="M5.2 8.2l1.9 1.9 3.7-3.9" fill="none" stroke="var(--color-surface)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>;
    case "failed": return <svg aria-hidden className={`${cls} text-danger`} height="16" viewBox="0 0 16 16" width="16"><circle cx="8" cy="8" fill="none" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5a3.5 3.5 0 010 7z" fill="currentColor" /></svg>;
    case "person": return <svg aria-hidden className={`${cls} text-warning`} height="16" viewBox="0 0 16 16" width="16"><circle cx="8" cy="8" fill="none" r="6" stroke="currentColor" strokeDasharray="2.4 2" strokeWidth="1.5" /><circle cx="8" cy="8" fill="currentColor" r="1.6" /></svg>;
    case "waiting": return <svg aria-hidden className={`${cls} text-brand`} height="16" viewBox="0 0 16 16" width="16"><circle cx="8" cy="8" fill="none" r="6" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" fill="currentColor" r="2.5" /></svg>;
    default: return <svg aria-hidden className={`${cls} text-faint`} height="16" viewBox="0 0 16 16" width="16"><circle cx="8" cy="8" fill="none" r="6" stroke="currentColor" strokeWidth="1.5" /></svg>;
  }
}
