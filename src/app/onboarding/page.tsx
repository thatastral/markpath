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
import { SetupExternalLink } from "@/components/setup-external-link";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { readTheme } from "@/components/theme/read-theme";
import { buttonClass, Notice, Progress, Swatch } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckIcon } from "@/components/ui/icons";
import { currentBrandDraft } from "@/server/brand/service";
import { logout } from "@/app/(app)/actions";
import { BrandStep } from "./brand-step";
import { StepFocus } from "./step-focus";
import { AgentPrefixForm, DesignStep, LogoStep } from "./steps";
import { finishOnboarding } from "./actions";

export const metadata = { title: "Set up Markpath" };

const steps = [
  { id: "brand", title: "Brand rules", why: "Show Markpath what on-brand looks like." },
  { id: "logo", title: "Logo", optional: true, why: "Optional. Helps the agents spot a wrong or stretched logo." },
  { id: "github", title: "GitHub", why: "Fixes to your code arrive as pull requests you review." },
  { id: "design", title: "Figma and Canva", optional: true, why: "Optional. Lets the Design agent check your designs too." },
  { id: "chat", title: "Chat room", why: "Where your team asks the agents for checks and approves fixes." },
] as const;
type StepId = (typeof steps)[number]["id"];

/** Next minor version for an edit: "2.0" → "2.1". Blank when the version isn't a number. */
const nextVersion = (v: string) => (/^\d+(\.\d+)?$/.test(v) ? (Math.round((parseFloat(v) + 0.1) * 10) / 10).toFixed(1) : "");

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string; problem?: string; edit?: string; new?: string }> }) {
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
  // Same denominator as the dashboard: only the required setup steps count (Logo and Figma/Canva are optional).
  const required = setup?.steps.filter((s) => !s.optional);
  const requiredTotal = required?.length ?? steps.filter((s) => !("optional" in s)).length;
  const requiredDone = required ? required.filter((s) => s.status === "done").length : steps.filter((s) => !("optional" in s) && done[s.id]).length;
  const skip = next ? <Link className={buttonClass("ghost")} href={`/onboarding?step=${next}`}>Skip for now</Link> : null;
  const prefix = ctx?.teamPrefix ?? "markpath";
  const onboarded = Boolean((db.prepare("SELECT onboarded_at FROM brands WHERE id = ?").get(brand.id) as { onboarded_at: string | null } | undefined)?.onboarded_at);
  const draft = current === "brand" && done.brand ? currentBrandDraft(brand.id) : null;
  const brandView = current !== "brand" ? null : params.new ? "new" : params.edit && draft ? "edit" : done.brand && draft ? "summary" : "new";
  const logo = current === "logo" ? db.prepare("SELECT content_type, data_base64 FROM brand_assets WHERE brand_id = ? AND kind = 'logo' ORDER BY created_at DESC LIMIT 1").get(brand.id) as { content_type: string; data_base64: string | null } | undefined : undefined;
  const logoPreview = logo?.data_base64 && /^image\/(png|jpeg|webp)$/.test(logo.content_type) ? `data:${logo.content_type};base64,${logo.data_base64}` : undefined;
  const theme = await readTheme();

  return <div className="relative min-h-dvh overflow-hidden bg-canvas">
    {/* A quiet picture of the dashboard behind the setup window, blurred, so setup feels like a step inside the app. */}
    <div aria-hidden className="pointer-events-none fixed inset-0 flex select-none blur-[6px]">
      <div className="hidden w-60 shrink-0 flex-col gap-2 border-r border-border bg-canvas p-3 lg:flex">
        <div className="mb-3 h-7 w-32 rounded-control bg-hover" />{[0, 1, 2, 3, 4, 5].map((i) => <div className="h-7 rounded-control bg-hover/70" key={i} />)}
      </div>
      <div className="flex-1 bg-surface p-8">
        <div className="h-6 w-40 rounded bg-hover" /><div className="mt-3 h-4 w-72 rounded bg-hover/70" />
        <div className="mt-8 grid max-w-3xl grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <div className="h-20 rounded-card border border-border" key={i} />)}</div>
        <div className="mt-6 max-w-3xl space-y-2">{[0, 1, 2, 3, 4].map((i) => <div className="h-12 rounded-panel border border-border" key={i} />)}</div>
      </div>
    </div>
    <div aria-hidden className="fixed inset-0 bg-[rgb(15_15_20/0.18)] backdrop-blur-[2px] dark:bg-black/50" />
    <main className="relative mx-auto grid min-h-dvh w-full max-w-4xl place-items-center px-4 py-8">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-why" className="anim-rise grid w-full grid-cols-[minmax(0,1fr)] overflow-hidden rounded-card border border-border bg-surface shadow-pop md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Setup steps" className="min-w-0 border-b border-border bg-canvas p-4 md:border-b-0 md:border-r">
          <div className="mb-3 grid gap-1.5">
            <p className="flex items-center justify-between gap-2 text-2xs font-medium text-muted"><span>Setup</span><span className="tabular-nums">{requiredDone} of {requiredTotal} required steps done</span></p>
            <Progress label="Required setup steps done" max={requiredTotal} value={requiredDone} />
          </div>
          <ol className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 md:mx-0 md:flex-col md:overflow-visible md:px-0">
            {steps.map((s, i) => { const on = s.id === current; return <li key={s.id} className="shrink-0">
              <Link href={`/onboarding?step=${s.id}`} aria-current={on ? "step" : undefined} className={`press flex min-h-10 items-center gap-2 rounded-control px-2 text-sm lg:min-h-8 ${on ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-border-strong)]" : "text-muted hover:bg-hover hover:text-ink"}`}>
                <span aria-hidden className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold tabular-nums ${done[s.id] ? "bg-success-soft text-success" : on ? "bg-brand-solid text-on-brand" : "border border-border-strong"}`}>{done[s.id] ? <CheckIcon size={12} /> : i + 1}</span>
                <span className="whitespace-nowrap">{s.title}</span>{"optional" in s && <span className="whitespace-nowrap text-2xs font-normal text-muted">Optional</span>}{done[s.id] && <span className="sr-only">(done)</span>}
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
            {brandView === "summary" && draft && <SavedRules draft={draft} next={onboarded ? "/brand" : "/onboarding?step=logo"} nextLabel={onboarded ? "Back to Brand" : "Continue"} />}
            {brandView === "edit" && draft && <BrandStep cancelHref={onboarded ? "/brand" : "/onboarding?step=brand"} initial={{ ...draft, version: nextVersion(draft.version), colours: [], fonts: [], found: [] }} />}
            {brandView === "new" && <BrandStep cancelHref={done.brand ? (onboarded ? "/brand" : "/onboarding?step=brand") : undefined} />}

            {current === "logo" && <LogoStep saved={done.logo} savedPreview={logoPreview} />}

            {current === "github" && <div className="space-y-4">
              <GithubConnect login={ctx?.github?.login ?? null} repo={ctx?.github?.repo ?? null} />
              <Actions skip={skip}>{done.github && <Link className={buttonClass("primary")} data-autofocus href="/onboarding?step=design">Continue</Link>}</Actions>
            </div>}

            {current === "design" && <DesignStep canva={ctx?.canva?.url ?? ""} figma={ctx?.figma?.url ?? ""} skip={next ? `/onboarding?step=${next}` : undefined} />}

            {current === "chat" && <div className="space-y-5">
              <ol className="space-y-5 text-sm">
                <li><p className="font-medium"><span className="tabular-nums text-muted">1.</span> Name your agents</p><p className="mb-2 text-xs text-muted">Keep the default or pick your own.</p><AgentPrefixForm prefix={prefix} /></li>
                <li><p className="font-medium"><span className="tabular-nums text-muted">2.</span> Copy your room template</p><p className="mb-2 text-xs text-muted">It already includes your agents&apos; names and keys.</p><CopyRoomTemplate autoFocus /></li>
                <li><p className="font-medium"><span className="tabular-nums text-muted">3.</span> Create the room in Switch Console</p><p className="mb-2 text-xs text-muted">Switch Console is the free desktop app that runs your agents and connects them to Telegram or Discord. Get it from <SetupExternalLink href="https://www.switchagents.ai">switchagents.ai</SetupExternalLink>, then paste the template there and create the room.</p><ChatApps /></li>
                <li><p className="font-medium"><span className="tabular-nums text-muted">4.</span> Say hello</p><p className="mb-2 text-xs text-muted">Send this in the room. This step turns green when an agent replies.</p><SetupCopyButton label="test message" value={`@${prefix}-director what's the status?`} /></li>
              </ol>
              {done.chat ? <Notice tone="success" role="status">An agent replied in your room. You&apos;re all set.</Notice> : <SetupRefreshButton waiting="No reply yet. Send the test message in your room, then check again." />}
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
type Draft = NonNullable<ReturnType<typeof currentBrandDraft>>;
/** Step 1 when rules already exist: what's saved, with Edit, Add new rules and Continue. */
function SavedRules({ draft, next, nextLabel }: { draft: Draft; next: string; nextLabel: string }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Primary colour", <span className="inline-flex items-center gap-1.5 font-mono" key="c"><Swatch className="h-3.5 w-3.5" value={draft.primaryColour} />{draft.primaryColour}</span>],
    ["Typeface", draft.typeface],
    ["Button corner radius", draft.buttonRadius],
    ...(draft.voice ? [["Tone of voice", draft.voice] as [string, React.ReactNode]] : []),
    ...(draft.previousColour || draft.previousTypeface || draft.previousRadius ? [["Old values to replace", [draft.previousColour, draft.previousTypeface, draft.previousRadius].filter(Boolean).join(", ")] as [string, React.ReactNode]] : []),
  ];
  return <div className="space-y-4">
    <Notice tone="success" role="status">Your brand rules are saved{draft.version ? ` (v${draft.version})` : ""}.</Notice>
    <dl className="divide-y divide-border rounded-card border border-border text-sm">{rows.map(([k, v]) => <div className="grid gap-1 px-3 py-2 sm:grid-cols-[11rem_minmax(0,1fr)]" key={k}><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}</dl>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
      <span className="flex flex-wrap gap-2"><Link className={buttonClass("secondary")} href="/onboarding?step=brand&edit=1">Edit rules</Link><Link className={buttonClass("ghost")} href="/onboarding?step=brand&new=1">Load from a new source</Link></span>
      <Link className={buttonClass("primary")} data-autofocus href={next}>{nextLabel}</Link>
    </div>
  </div>;
}
