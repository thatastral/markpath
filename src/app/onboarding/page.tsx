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
import { buttonClass, Notice, Progress } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDrop, UrlInput } from "@/components/ui/file-drop";
import { CheckIcon } from "@/components/ui/icons";
import { BrandStep } from "./brand-step";
import { StepFocus } from "./step-focus";
import { finishOnboarding, saveDesignLinks, uploadOnboardingLogo } from "./actions";

export const metadata = { title: "Set up Markpath" };

const steps = [
  { id: "brand", title: "Brand rules", why: "Show Markpath what on-brand looks like." },
  { id: "logo", title: "Logo", why: "Optional. Helps the agents spot a wrong or stretched logo." },
  { id: "github", title: "GitHub", why: "Fixes to your code arrive as pull requests you review." },
  { id: "design", title: "Figma and Canva", why: "Optional. Lets the Design agent check your designs too." },
  { id: "chat", title: "Chat room", why: "Where your team asks the agents for checks and approves fixes." },
] as const;
type StepId = (typeof steps)[number]["id"];

const fieldLabel = "text-xs font-medium text-ink";
const help = "block text-xs text-muted";

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
  const doneCount = steps.filter((s) => done[s.id]).length;
  const skip = next ? <Link className={buttonClass("ghost")} href={`/onboarding?step=${next}`}>Skip for now</Link> : null;
  const prefix = ctx?.teamPrefix ?? "markpath";

  return <div className="min-h-dvh bg-canvas">
    <div aria-hidden className="fixed inset-0 bg-[rgb(15_15_20/0.04)] dark:bg-black/30" />
    <main className="relative mx-auto grid min-h-dvh w-full max-w-4xl place-items-center px-4 py-6 sm:py-10">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-why" className="anim-rise grid w-full grid-cols-[minmax(0,1fr)] overflow-hidden rounded-card border border-border bg-surface shadow-pop md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Setup steps" className="min-w-0 border-b border-border bg-canvas p-4 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center gap-2"><Logo /><span className="min-w-0 truncate text-sm font-semibold" title={brand.name}>{brand.name}</span></div>
          <div className="mb-3 grid gap-1.5">
            <p className="flex items-center justify-between text-2xs font-medium text-muted"><span>Setup</span><span className="tabular-nums">{doneCount} of {steps.length} done</span></p>
            <Progress label="Setup progress" max={steps.length} value={doneCount} />
          </div>
          <ol className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-col md:overflow-visible md:px-0">
            {steps.map((s, i) => { const on = s.id === current; return <li key={s.id} className="shrink-0">
              <Link href={`/onboarding?step=${s.id}`} aria-current={on ? "step" : undefined} className={`press flex min-h-10 items-center gap-2 rounded-control px-2 text-sm lg:min-h-8 ${on ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-border-strong)]" : "text-muted hover:bg-hover hover:text-ink"}`}>
                <span aria-hidden className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold tabular-nums ${done[s.id] ? "bg-success-soft text-success" : on ? "bg-brand-solid text-white" : "border border-border-strong"}`}>{done[s.id] ? <CheckIcon size={12} /> : i + 1}</span>
                <span className="whitespace-nowrap">{s.title}</span>{done[s.id] && <span className="sr-only">(done)</span>}
              </Link>
            </li>; })}
          </ol>
        </nav>

        <section className="flex min-w-0 flex-col p-5 sm:p-7" id="onboarding-step">
          <StepFocus container="onboarding-step" key={current} />
          <p className="text-2xs font-medium tabular-nums text-muted">Step {index + 1} of {steps.length}</p>
          <h1 id="onboarding-title" tabIndex={-1} className="mt-1 text-lg font-semibold tracking-tight outline-none">{step.title}</h1>
          <p id="onboarding-why" className="mt-1 text-sm text-muted">{step.why}</p>
          {params.problem && <div className="mt-4"><Notice tone="danger" role="alert">{params.problem}</Notice></div>}
          <div className="mt-5">
            {current === "brand" && (done.brand && !requested ? <Done text="Your brand rules are saved." next="logo" /> : <BrandStep />)}

            {current === "logo" && <form action={uploadOnboardingLogo} className="space-y-4">
              <div className="space-y-1.5"><label className={fieldLabel} htmlFor="onb-logo">Logo file</label>
                <FileDrop accept="image/png,image/jpeg,image/webp" autoFocus hint={done.logo ? "Your logo is saved. Add another to replace it." : "PNG, JPG or WebP, up to 1 MB."} id="onb-logo" maxBytes={1_000_000} name="logo" />
              </div>
              <Actions skip={skip}><SubmitButton className={buttonClass("primary")} pendingLabel="Saving…">Save and continue</SubmitButton></Actions>
            </form>}

            {current === "github" && <div className="space-y-4">
              <GithubConnect login={ctx?.github?.login ?? null} repo={ctx?.github?.repo ?? null} />
              <Actions skip={skip}>{done.github && <Link className={buttonClass("primary")} data-autofocus href="/onboarding?step=design">Continue</Link>}</Actions>
            </div>}

            {current === "design" && <form action={saveDesignLinks} className="space-y-4">
              <div className="space-y-1.5"><label className={fieldLabel} htmlFor="onb-figma">Figma file link</label>
                <UrlInput autoFocus defaultValue={ctx?.figma?.url ?? ""} site="figma" id="onb-figma" name="figma" placeholder="https://www.figma.com/design/…" /></div>
              <div className="space-y-1.5"><label className={fieldLabel} htmlFor="onb-canva">Canva design link</label>
                <UrlInput defaultValue={ctx?.canva?.url ?? ""} site="canva" id="onb-canva" name="canva" placeholder="https://www.canva.com/design/…" /></div>
              <p className={help}>Add one or both. The Design agent edits them through your Figma and Canva accounts, so connect both once in <a className="font-medium text-brand hover:underline" href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">Claude settings<span className="sr-only"> (opens in a new tab)</span></a> on the computer that runs your agents. In Canva it changes colours only, not fonts.</p>
              <Actions skip={skip}><SubmitButton className={buttonClass("primary")} pendingLabel="Saving…">Save and continue</SubmitButton></Actions>
            </form>}

            {current === "chat" && <div className="space-y-5">
              <ol className="space-y-5 text-sm">
                <li><p className="font-medium"><span className="tabular-nums text-muted">1.</span> Copy your room template</p><p className="mb-2 text-xs text-muted">It already includes your agents&apos; keys.</p><CopyRoomTemplate autoFocus /></li>
                <li><p className="font-medium"><span className="tabular-nums text-muted">2.</span> Create the room in Switch Console</p><p className="mb-2 text-xs text-muted">Paste the template there and create the room.</p><ChatApps /></li>
                <li><p className="font-medium"><span className="tabular-nums text-muted">3.</span> Say hello</p><p className="mb-2 text-xs text-muted">Send this in the room. This step turns green when an agent replies.</p><SetupCopyButton label="test message" value={`@${prefix}-director what's the status?`} /></li>
              </ol>
              {done.chat ? <Notice tone="success" role="status">An agent replied in your room. You&apos;re all set.</Notice> : <SetupRefreshButton />}
              <form action={finishOnboarding} className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                {!done.chat && <span className="mr-auto text-xs text-muted">You can finish this later in Integrations.</span>}
                <SubmitButton className={buttonClass(done.chat ? "primary" : "secondary")} pendingLabel="Opening…">{done.chat ? "Go to dashboard" : "Finish later"}</SubmitButton>
              </form>
            </div>}
          </div>
          {current !== "chat" && <form action={finishOnboarding} className="mt-6 flex justify-center"><SubmitButton className="press inline-flex min-h-10 items-center rounded-control px-2 text-xs text-muted hover:text-ink lg:min-h-8" pendingLabel="Opening…">Skip setup for now</SubmitButton></form>}
        </section>
      </div>
    </main>
  </div>;
}

function Actions({ children, skip }: { children?: React.ReactNode; skip: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">{skip ?? <span />}<span className="ml-auto flex gap-2">{children}</span></div>;
}
function Done({ text, next }: { text: string; next: StepId }) {
  return <div className="space-y-4"><Notice tone="success" role="status">{text}</Notice><div className="flex justify-between gap-2"><Link className={buttonClass("ghost")} href="/onboarding?step=brand&edit=1">Edit rules</Link><Link className={buttonClass("primary")} data-autofocus href={`/onboarding?step=${next}`}>Continue</Link></div></div>;
}
