import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getSetupData } from "@/server/dashboard/setup";
import { Logo } from "@/components/main-nav";
import { GithubConnect } from "@/components/github-connect";
import { CopyRoomTemplate } from "@/components/copy-room-template";
import { ChatApps } from "@/components/chat-apps";
import { SetupCopyButton } from "@/components/setup-copy-button";
import { SetupRefreshButton } from "@/components/setup-refresh-button";
import { buttonClass, inputClass, Notice } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import { BrandStep } from "./brand-step";
import { finishOnboarding, saveDesignLinks, uploadOnboardingLogo } from "./actions";

export const metadata = { title: "Set up Markpath" };

const steps = [
  { id: "brand", title: "Brand rules", why: "Tell Markpath what on-brand looks like." },
  { id: "logo", title: "Logo", why: "Optional. Lets agents spot a wrong or stretched logo." },
  { id: "github", title: "GitHub", why: "So fixes to your code arrive as pull requests." },
  { id: "design", title: "Figma and Canva", why: "Optional. So designs get checked too." },
  { id: "chat", title: "Chat room", why: "Where your team talks to the agents." },
] as const;
type StepId = (typeof steps)[number]["id"];

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string; problem?: string }> }) {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/workspaces/new");
  const params = await searchParams;
  const setup = await Promise.race([getSetupData(db, brand.id, userId), new Promise<null>((r) => setTimeout(() => r(null), 1500))]).catch(() => null);
  const ctx = setup?.context;
  const done: Record<StepId, boolean> = {
    brand: setup?.steps.find((s) => s.key === "brand")?.status === "done",
    logo: Boolean(db.prepare("SELECT 1 FROM brand_assets WHERE brand_id = ? AND kind = 'logo'").get(brand.id)),
    github: Boolean(ctx?.github?.repo),
    design: Boolean(ctx?.figma || ctx?.canva),
    chat: (ctx?.roomReplies ?? 0) > 0,
  };
  const requested = steps.find((s) => s.id === params.step)?.id;
  const current: StepId = requested ?? (done.brand ? steps.find((s) => !done[s.id])?.id ?? "chat" : "brand");
  const index = steps.findIndex((s) => s.id === current);
  const next = steps[index + 1]?.id;
  const step = steps[index];
  const skip = next ? <Link className={buttonClass("ghost")} href={`/onboarding?step=${next}`}>Skip for now</Link> : null;
  const prefix = ctx?.teamPrefix ?? "markpath";

  return <div className="min-h-dvh bg-canvas">
    <div aria-hidden className="fixed inset-0 bg-[rgb(15_15_20/0.04)] dark:bg-black/30" />
    <main className="relative mx-auto grid min-h-dvh w-full max-w-4xl place-items-center px-4 py-8">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="anim-rise grid w-full overflow-hidden rounded-card border border-border bg-surface shadow-pop md:grid-cols-[14rem_1fr]">
        <nav aria-label="Setup steps" className="border-b border-border bg-canvas p-4 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between"><Logo /><span className="text-2xs text-muted md:hidden">Step {index + 1} of {steps.length}</span></div>
          <p className="mb-2 hidden truncate text-2xs font-medium text-muted md:block">Setting up {brand.name}</p>
          <ol className="flex gap-1 overflow-x-auto md:flex-col">
            {steps.map((s, i) => <li key={s.id} className="shrink-0">
              <Link href={`/onboarding?step=${s.id}`} aria-current={s.id === current ? "step" : undefined} className={`flex min-h-10 items-center gap-2 rounded-control px-2 text-sm lg:min-h-8 ${s.id === current ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-border)]" : "text-muted hover:bg-hover hover:text-ink"}`}>
                <span aria-hidden className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs ${done[s.id] ? "bg-success-soft text-success" : s.id === current ? "bg-brand-solid text-white" : "border border-border-strong"}`}>{done[s.id] ? <CheckIcon size={12} /> : i + 1}</span>
                <span className="whitespace-nowrap">{s.title}</span>{done[s.id] && <span className="sr-only">(done)</span>}
              </Link>
            </li>)}
          </ol>
        </nav>

        <section className="min-w-0 p-5 sm:p-7">
          <p className="text-2xs font-medium text-muted">Step {index + 1} of {steps.length}</p>
          <h1 id="onboarding-title" className="mt-1 text-lg font-semibold tracking-tight">{step.title}</h1>
          <p className="mt-1 text-sm text-muted">{step.why}</p>
          {params.problem && <div className="mt-4"><Notice tone="danger" role="alert">{params.problem}</Notice></div>}
          <div className="mt-5">
            {current === "brand" && (done.brand && !requested ? <Done text="Brand rules are saved." next="logo" /> : <BrandStep />)}

            {current === "logo" && <form action={uploadOnboardingLogo} className="space-y-4">
              <label className="block space-y-1.5"><span className="text-xs font-medium">Your logo</span>
                <input className={`${inputClass} file:mr-3 file:rounded-[5px] file:border-0 file:bg-hover file:px-2.5 file:py-1 file:text-sm file:font-medium`} type="file" name="logo" accept="image/png,image/jpeg,image/webp" />
                <span className="block text-xs text-muted">{done.logo ? "A logo is saved. Upload another to replace it." : "PNG, JPG or WebP, up to 1 MB."}</span>
              </label>
              <Actions skip={skip}><button className={buttonClass("primary")} type="submit">Continue</button></Actions>
            </form>}

            {current === "github" && <div className="space-y-4">
              <GithubConnect login={ctx?.github?.login ?? null} repo={ctx?.github?.repo ?? null} />
              <p className="text-xs text-muted">Markpath never merges or touches your main branch. Every fix is a pull request you review.</p>
              <Actions skip={skip}>{done.github && <Link className={buttonClass("primary")} href="/onboarding?step=design">Continue</Link>}</Actions>
            </div>}

            {current === "design" && <form action={saveDesignLinks} className="space-y-4">
              <label className="block space-y-1.5"><span className="text-xs font-medium">Figma file link</span>
                <input className={inputClass} name="figma" type="url" inputMode="url" defaultValue={ctx?.figma?.url ?? ""} placeholder="https://www.figma.com/design/…" /></label>
              <label className="block space-y-1.5"><span className="text-xs font-medium">Canva design link</span>
                <input className={inputClass} name="canva" type="url" inputMode="url" defaultValue={ctx?.canva?.url ?? ""} placeholder="https://www.canva.com/design/…" /></label>
              <p className="text-xs text-muted">The Design agent edits these through the Figma and Canva connectors. Sign them in once at <a className="font-medium text-brand hover:underline" href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">claude.ai/settings/connectors</a> on the computer that runs your agents.</p>
              <Actions skip={skip}><button className={buttonClass("primary")} type="submit">Continue</button></Actions>
            </form>}

            {current === "chat" && <div className="space-y-5">
              <ol className="space-y-4 text-sm">
                <li><p className="font-medium">1. Copy your room template</p><p className="mb-2 text-xs text-muted">It already holds this workspace's agent keys.</p><CopyRoomTemplate /></li>
                <li><p className="font-medium">2. Create the room in Switch Console</p><p className="mb-2 text-xs text-muted">Paste the template, pick your chat app, create the room.</p><ChatApps /></li>
                <li><p className="font-medium">3. Say hello</p><p className="mb-2 text-xs text-muted">This step turns green when an agent answers.</p><SetupCopyButton label="test message" value={`@${prefix}-director what's the status?`} /></li>
              </ol>
              {done.chat ? <Notice tone="success" role="status">An agent answered in your room. You're ready.</Notice> : <SetupRefreshButton />}
              <form action={finishOnboarding} className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                {!done.chat && <span className="mr-auto text-xs text-muted">You can finish this later from Integrations.</span>}
                <button className={buttonClass(done.chat ? "primary" : "secondary")} type="submit">{done.chat ? "Go to dashboard" : "Finish later"}</button>
              </form>
            </div>}
          </div>
          {current !== "chat" && <form action={finishOnboarding} className="mt-6 text-center"><button className="text-xs text-muted hover:text-ink hover:underline" type="submit">Skip setup and go to the dashboard</button></form>}
        </section>
      </div>
    </main>
  </div>;
}

function Actions({ children, skip }: { children?: React.ReactNode; skip: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">{skip ?? <span />}<span className="flex gap-2">{children}</span></div>;
}
function Done({ text, next }: { text: string; next: StepId }) {
  return <div className="space-y-4"><Notice tone="success" role="status">{text}</Notice><div className="flex justify-between gap-2"><Link className={buttonClass("ghost")} href="/onboarding?step=brand&edit=1">Change</Link><Link className={buttonClass("primary")} href={`/onboarding?step=${next}`}>Continue</Link></div></div>;
}
