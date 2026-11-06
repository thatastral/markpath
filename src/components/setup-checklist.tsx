import Link from "next/link";

export type SetupStep = { label: string; detail: string; href: string; done: boolean };
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;
  return <section aria-label="Setup" className="mt-6 rounded-lg border border-border bg-surface p-5"><h2 className="text-lg font-semibold">Get started <span className="text-sm font-normal text-muted">· {steps.length - remaining} of {steps.length} done</span></h2><ol className="mt-3 grid gap-2">{steps.map((s) => <li className="flex items-start gap-3 text-sm" key={s.label}><span aria-hidden className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border ${s.done ? "border-brand bg-brand" : "border-border"}`} /><span><Link className={`font-medium ${s.done ? "text-muted line-through" : "underline"}`} href={s.href}>{s.label}</Link><span className="block text-muted">{s.detail}</span></span></li>)}</ol></section>;
}
