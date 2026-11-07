import type { ReactNode } from "react";
import { Logo } from "@/components/main-nav";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { readTheme } from "@/components/theme/read-theme";

/** Linear-like centred card for sign-in, sign-up and other single-purpose pages. Theme switcher in the footer. */
export async function AuthFrame({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const theme = await readTheme();
  return <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
    <section className="anim-rise w-full max-w-[22.5rem]">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <div className="rounded-card border border-border bg-surface p-6">
        <h1 className="text-center text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-center text-sm text-muted">{description}</p>}
        {children}
      </div>
      {footer && <p className="mt-5 text-center text-sm text-muted">{footer}</p>}
      <div className="mt-8 flex justify-center"><ThemeSwitcher initial={theme} /></div>
    </section>
  </main>;
}
