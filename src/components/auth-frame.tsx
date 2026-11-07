import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/main-nav";
import { Mascot } from "@/components/mascot";
import { CheckIcon } from "@/components/ui/icons";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { readTheme } from "@/components/theme/read-theme";

const points = [
  "One source of truth for colour, type and spacing.",
  "Agents fix the files, not just flag them.",
  "Approve from chat or the dashboard.",
];

/** Split auth screen: a dark brand panel on the left, a quiet dotted form column on the right. */
export async function AuthFrame({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const theme = await readTheme();
  return <main className="relative isolate min-h-dvh overflow-hidden bg-canvas">
    <div aria-hidden className="mp-dots absolute inset-0 -z-10 text-border-strong opacity-50 [mask-image:radial-gradient(120%_90%_at_70%_0%,black,transparent_88%)]" />
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="order-last flex min-h-dvh flex-col px-5 pb-8 pt-7 sm:px-10 sm:pt-9">
        <div className="mx-auto flex w-full max-w-[23rem] flex-1 flex-col">
          <Link className="inline-flex w-fit items-center gap-2 rounded-control text-sm font-semibold tracking-tight" href="/"><Logo />Markpath</Link>

          <div className="flex flex-1 flex-col justify-center py-10 sm:py-12">
            <div className="anim-rise">
              <h1 className="text-balance text-[27px] font-semibold leading-tight tracking-tight">{title}</h1>
              {description && <p className="mt-2 text-balance text-sm leading-6 text-muted">{description}</p>}
              <div className="mt-7 rounded-card border border-border bg-surface/90 p-6 backdrop-blur-sm">{children}</div>
              {footer && <p className="mt-5 text-balance text-sm text-muted">{footer}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <ThemeSwitcher initial={theme} />
            <Link className="text-xs font-medium text-muted transition-colors hover:text-ink" href="/">Back home</Link>
          </div>
        </div>
      </section>

      <aside className="order-first relative hidden overflow-hidden border-r border-border bg-[#0d0e10] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden className="mp-dots absolute inset-0 text-white opacity-[0.1] [mask-image:radial-gradient(120%_90%_at_0%_0%,black,transparent_75%)]" />
        <div className="relative">
          <p className="text-2xs font-medium uppercase tracking-[0.18em] text-white/40">The brand room</p>
          <h2 className="mt-5 max-w-[19rem] text-balance text-[30px] font-semibold leading-[1.12] tracking-tight">Your brand, everywhere it ships.</h2>
          <p className="mt-4 max-w-[20rem] text-sm leading-6 text-white/55">Markpath reads your guidelines once, then checks GitHub, Figma and Canva for drift. Agents fix what is off and open the pull request.</p>
          <ul className="mt-8 grid gap-3">
            {points.map((point) => <li className="flex items-start gap-2.5 text-sm leading-5 text-white/75" key={point}><CheckIcon className="mt-0.5 shrink-0 text-white/40" size={15} />{point}</li>)}
          </ul>
        </div>

        <div className="relative mt-10">
          <div className="rounded-card border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/45">This week</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2 py-0.5 text-2xs font-medium text-white/60"><span aria-hidden className="h-1 w-1 rounded-full bg-success" />Live</span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div><p className="text-2xl font-semibold tracking-tight">18</p><p className="mt-0.5 text-xs text-white/45">off-brand values fixed</p></div>
              <div className="flex -space-x-2">
                {(["director", "design", "implementation", "qa"] as const).map((kind) => <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" key={kind}><Mascot size={22} kind={kind} /></span>)}
              </div>
            </div>
          </div>
          <p className="mt-5 text-2xs text-white/30">One room for the brand, the agents and the work.</p>
        </div>
      </aside>
    </div>
  </main>;
}
