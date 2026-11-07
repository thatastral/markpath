import type { ReactNode } from "react";

/* Shared Markpath primitives. Rules: .claude/skills/markpath-design/SKILL.md */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-solid text-white shadow-card hover:bg-brand-solid-hover",
  secondary: "border border-border-strong bg-surface text-ink shadow-card hover:bg-subtle",
  ghost: "text-muted hover:bg-subtle hover:text-ink",
  danger: "border border-border-strong bg-surface text-ink hover:border-danger hover:bg-danger-soft hover:text-danger",
};

/** Class string for a button-looking element (works on <button>, <a> and <Link>). */
export function buttonClass(variant: ButtonVariant = "secondary", size: "md" | "sm" = "md", extra = "") {
  const sizing = size === "md" ? "min-h-10 px-4 text-sm" : "min-h-9 px-3 text-sm";
  return `inline-flex max-w-full select-none items-center justify-center gap-2 rounded-control py-2 text-center font-medium leading-5 disabled:opacity-60 ${sizing} ${variants[variant]} ${extra}`.trim();
}

/** An underlined text link with a 40px hit area. */
export const linkClass = "inline-flex min-h-10 items-center gap-1 font-medium text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "border-border bg-subtle text-muted",
  brand: "border-transparent bg-brand-soft text-brand",
  success: "border-transparent bg-success-soft text-success",
  warning: "border-transparent bg-warning-soft text-warning",
  danger: "border-transparent bg-danger-soft text-danger",
};
const dots: Record<Tone, string> = { neutral: "bg-muted", brand: "bg-brand", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };

/** A status label. The text always carries the meaning; the colour only reinforces it. */
export function Badge({ tone = "neutral", children, dot = true, className = "" }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>{dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />}{children}</span>;
}

export const severityTone = (s: string): Tone => (s === "high" || s === "critical" ? "danger" : s === "medium" ? "warning" : "neutral");

export const cardClass = "rounded-card border border-border bg-surface shadow-card";

export function Card({ children, className = "", as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: "div" | "article" | "section" | "li"; id?: string; "aria-labelledby"?: string; "aria-label"?: string }) {
  return <Tag className={`${cardClass} ${className}`} {...rest}>{children}</Tag>;
}

export function PageHeader({ eyebrow, title, description, actions, children }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div className="min-w-0 max-w-2xl">
      <p className="text-sm font-medium text-brand">{eyebrow}</p>
      <h1 className="mt-1.5 text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-base leading-relaxed text-muted">{description}</p>}
      {children}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}

export function SectionHeading({ id, title, count, action }: { id?: string; title: ReactNode; count?: number; action?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight" id={id}>{title}{count !== undefined && <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium tabular-nums text-muted">{count}</span>}</h2>
    {action}
  </div>;
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className={`${cardClass} flex flex-col items-center px-6 py-10 text-center`}>
    <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted">{icon}</span>
    <p className="mt-3 font-medium">{title}</p>
    {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>;
}

/** Notice banner for ?saved= / ?problem= / ?message= feedback. */
export function Notice({ tone = "neutral", children, role }: { tone?: "neutral" | "success" | "danger"; children: ReactNode; role: "status" | "alert" }) {
  const style = tone === "danger" ? "border-danger/40 bg-danger-soft text-danger" : tone === "success" ? "border-success/30 bg-success-soft text-success" : "border-border bg-surface text-ink";
  return <p className={`anim-rise mt-6 rounded-control border px-4 py-3 text-sm ${style}`} role={role}>{children}</p>;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (v: string | null | undefined): v is string => Boolean(v && HEX.test(v.trim()));

export function Swatch({ value, className = "" }: { value: string; className?: string }) {
  return <span aria-hidden className={`inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] ring-1 ring-inset ring-black/10 dark:ring-white/15 ${className}`} style={{ backgroundColor: value.trim() }} />;
}

/** A raw brand value (colour, font, radius) as a mono pill, with a swatch for colours. */
export function ValuePill({ value, tone = "neutral" }: { value: string; tone?: "neutral" | "old" | "new" }) {
  const style = tone === "old" ? "border-danger/25 bg-danger-soft text-danger" : tone === "new" ? "border-success/25 bg-success-soft text-success" : "border-border bg-subtle text-ink";
  return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[0.8125rem] ${style}`}>{isHex(value) && <Swatch value={value} />}<span className="min-w-0 break-all">{value}</span></span>;
}

export function ChangeArrow() {
  return <span aria-hidden className="text-muted">→</span>;
}

const AGENTS: Array<[RegExp, string, string]> = [
  [/director/i, "BD", "bg-brand-soft text-brand"],
  [/design|figma/i, "DA", "bg-[#f1ebff] text-[#6b3fd4] dark:bg-[#231a3d] dark:text-[#b9a2ff]"],
  [/implement|github|audit/i, "IA", "bg-warning-soft text-warning"],
  [/qa/i, "QA", "bg-success-soft text-success"],
];

/** A tinted identity tile per agent; people get a neutral tile. */
export function AgentAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const human = /^human/i.test(name);
  const hit = human ? undefined : AGENTS.find(([re]) => re.test(name));
  const initials = hit?.[1] ?? name.replace(/^Human:\s*/i, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dims = size === "md" ? "h-7 w-7 text-[0.6875rem]" : "h-6 w-6 text-[0.625rem]";
  return <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-lg font-semibold tracking-wide ${dims} ${hit?.[2] ?? "bg-subtle text-muted"}`}>{initials}</span>;
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return <div aria-label={label} aria-valuemax={max} aria-valuemin={0} aria-valuenow={value} className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" role="progressbar">
    <div className={`progress-fill h-full w-full rounded-full ${ratio === 1 ? "bg-success" : "bg-brand-solid"}`} style={{ transform: `scaleX(${ratio})` }} />
  </div>;
}
