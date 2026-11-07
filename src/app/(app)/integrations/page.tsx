import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getIntegrations } from "@/server/dashboard/service";
import { getSetupData, type SetupKey } from "@/server/dashboard/setup";
import { schedulesAudits, watchesPulls } from "@/server/integrations/github";
import { ChatApps } from "@/components/chat-apps";
import { CopyRoomTemplate } from "@/components/copy-room-template";
import { GithubConnect } from "@/components/github-connect";
import { FigmaPluginCard } from "@/components/figma-plugin-card";
import { SetupClearNotice } from "@/components/setup-clear-notice";
import { SetupCopyButton } from "@/components/setup-copy-button";
import { SetupExternalLink } from "@/components/setup-external-link";
import { SetupRefreshButton } from "@/components/setup-refresh-button";
import { SetupStepCard, setupUi } from "@/components/setup-step";
import { connectionLabel, providerName, whenText } from "@/lib/labels";
import { Badge, bodyClass, buttonClass, cardClass, Notice, PageHeader, Progress, SectionHeading } from "@/components/ui/primitives";
import { SetupStatusBadge } from "@/components/setup-step";
import { BrandIcon, ChevronRight, EyeCheckIcon, ProviderIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { UrlInput } from "@/components/ui/file-drop";
import { runRepoAuditAction, saveCanvaDesignAction, saveWatchPullsAction, saveChatHandle, saveFigmaFileAction, saveTeamPrefix } from "./actions";
import { pageTitle } from "../page-title";
export async function generateMetadata() { return { title: await pageTitle("Integrations") }; }

const label = "text-sm font-medium";
const help = "text-muted";
const field = "grid gap-1 text-sm";
const row = "flex flex-wrap gap-2";
const CONNECTORS = "https://claude.ai/settings/connectors";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ saved?: string; problem?: string; show?: string; open?: string }> }) {
  const notice = await searchParams;
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const setup = await getSetupData(db, brand.id, userId);
  const { teamPrefix, chatHandle, github, figma, canva, switchReachable, roomReplies } = setup.context;
  const integrations = getIntegrations(db, brand.id);
  const required = setup.steps.filter((s) => !s.optional).length; const optionalCount = setup.steps.length - required;
  // One primary per page: the next unfinished required step. Everything else is secondary.
  const nextKey = setup.steps.find((s) => !s.optional && s.status !== "done")?.key;
  const cardLabel = (step: (typeof setup.steps)[number]) => step.status === "done" ? "Manage" : step.status === "needs_you" && (step.key === "figma" || step.key === "canva") ? "Edit" : step.key === "brand" || step.key === "check" ? "Set up" : "Connect";

  const actions: Record<SetupKey, ReactNode> = {
    brand: <Link className={setup.steps[0].status === "needs_you" ? setupUi.primary : setupUi.secondary} href="/brand">{setup.steps[0].status === "done" ? "Open brand rules" : setup.steps[0].status === "needs_you" ? "Review and approve rules" : "Upload your guideline"}</Link>,

    github: <GithubConnect login={github?.login ?? null} repo={github?.repo ?? null} />,

    figma: <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><SetupExternalLink href={CONNECTORS}>Connect Figma in Claude</SetupExternalLink>{figma && <SetupExternalLink href={figma.url}>Open the file</SetupExternalLink>}</div>
      <form action={saveFigmaFileAction} className={field}>
      <label className={label} htmlFor="figma-link">Figma file link</label>
      <div className={row}><UrlInput className="w-full sm:w-auto sm:flex-1" defaultValue={figma?.url ?? ""} site="figma" id="figma-link" name="link" placeholder="https://www.figma.com/design/…" /><SubmitButton className={setupUi.secondary} pendingLabel="Saving…">Save Figma link</SubmitButton></div>
      <span className={help}>{figma ? "To stop using this file, clear the link and save." : "Copy the file's address from your browser and paste it here."}</span>
      </form>
    </div>,

    canva: <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><SetupExternalLink href={CONNECTORS}>Connect Canva in Claude</SetupExternalLink>{canva && <SetupExternalLink href={canva.url}>Open the design</SetupExternalLink>}</div>
      <form action={saveCanvaDesignAction} className={field}>
      <label className={label} htmlFor="canva-link">Canva design link</label>
      <div className={row}><UrlInput className="w-full sm:w-auto sm:flex-1" defaultValue={canva?.url ?? ""} site="canva" id="canva-link" name="link" placeholder="https://www.canva.com/design/…" /><SubmitButton className={setupUi.secondary} pendingLabel="Saving…">Save Canva link</SubmitButton></div>
      <span className={help}>{canva ? "To stop using this design, clear the link and save." : "Copy the design's address from your browser and paste it here."}</span>
      </form>
    </div>,

    chat: <div className="grid gap-5 text-sm">
      <p><span className="font-medium">Which chat app?</span> Telegram works today. Discord is in beta. Slack and Teams are coming soon.</p>
      <p className={help}>{switchReachable ? "Markpath can reach Switch, which runs your chat room." : "Markpath can't reach Switch, which runs your chat room. Start Switch, then select Check again."}</p>
      <form action={saveTeamPrefix} className={field}>
        <label className={label} htmlFor="prefix">1. Name your agents</label>
        <div className={row}><input className={`${setupUi.input} sm:max-w-xs`} defaultValue={teamPrefix} id="prefix" name="prefix" /><SubmitButton className={setupUi.secondary} pendingLabel="Saving…">Save name</SubmitButton></div>
        <span className={help}>Set this before step 2. Changing it later means creating a new room. Your agents will be:</span>
        <span className="flex flex-wrap gap-x-4 gap-y-2">{["director", "design"].map((role) => <SetupCopyButton key={role} label={`agent name ${teamPrefix}-${role}`} value={`@${teamPrefix}-${role}`} />)}</span>
      </form>
      <div className="grid gap-2">
        <p className={label}>2. Copy the room template</p>
        <p className={help}>It includes your agents&apos; keys. In Switch Console, create a room and paste it in.</p>
        <CopyRoomTemplate />
      </div>
      <div><p className={label}>3. Connect your chat app</p><ChatApps /></div>
      <form action={saveChatHandle} className={field}>
        <label className={label} htmlFor="handle">4. Your chat username</label>
        <div className={row}><input className={`${setupUi.input} sm:max-w-xs`} defaultValue={chatHandle} id="handle" name="handle" placeholder="your-username" /><SubmitButton className={setupUi.secondary} pendingLabel="Saving…">Save username</SubmitButton></div>
        <span className={help}>Without the @. Lets you approve changes by replying in the room.</span>
      </form>
      <div className="rounded-control border border-border bg-surface p-4">
        <p className={label}>Test it</p>
        <p className="mt-1">Send this in the room. This step turns green when an agent replies.</p>
        <p className="mt-2"><SetupCopyButton label="test message" value={`@${teamPrefix}-director what's the status?`} /></p>
        {roomReplies > 0 && <p className="mt-2 text-success">Agents have replied <span className="tabular-nums">{roomReplies === 1 ? "once" : `${roomReplies} times`}</span> so far.</p>}
      </div>
    </div>,

    check: <div className="flex flex-wrap items-center gap-3 text-sm">
      {github?.repo && <form action={runRepoAuditAction}><SubmitButton className={setup.steps[5].status === "done" ? setupUi.secondary : setupUi.primary} pendingLabel="Checking…" title={`Check ${github.repo} now`}><span className="max-w-[16rem] truncate">Check {github.repo} now</span></SubmitButton></form>}
      <Link className={setupUi.secondary} href="/reviews">See results</Link>
    </div>,
  };

  const notes: Partial<Record<SetupKey, ReactNode>> = {
    figma: "Connect Figma in Claude on the computer that runs your agents. You need edit access to the file (a paid Figma seat). Skip this to use the sample file.",
    canva: "Edits run as the Canva account connected in Claude. Canva can't change fonts.",
  };

  const connected = setup.steps.filter((x) => x.status === "done"); const open = setup.steps.filter((x) => x.status !== "done");
  const chips: Array<[string, string, number]> = [["All", "all", setup.steps.length], ["Connected", "connected", connected.length], ["Needs setup", "setup", open.length]];
  const shown = notice.show === "connected" ? connected : notice.show === "setup" ? open : setup.steps;
  const toolIcon = (key: SetupKey, connected = true) => key === "brand" ? <BrandIcon /> : key === "check" ? <EyeCheckIcon /> : <ProviderIcon connected={connected} provider={key === "chat" ? "switch" : key} size={18} />;
  return <main className="anim-rise">
    <SetupClearNotice />
    <PageHeader actions={<SetupRefreshButton />} description="Connect your tools in order. A step turns green only after Markpath has used it, so green means it works." title="Integrations" />
    <div className={bodyClass}>
    {(notice.saved || notice.problem) && <div className="mb-6 grid gap-2">
      {notice.saved && <Notice role="status" tone="success">{notice.saved}</Notice>}
      {notice.problem && <Notice role="alert" tone="danger">{notice.problem}</Notice>}
    </div>}

    <section aria-labelledby="tools-grid-heading" className="mb-10">
      <SectionHeading description="Pick a tool to jump to its setup step." id="tools-grid-heading" title="Your tools" />
      <nav aria-label="Filter tools" className="mt-3 flex flex-wrap gap-1">{chips.map(([label, value, count]) => { const on = (notice.show ?? "all") === value; return <Link aria-current={on ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium lg:min-h-7 ${on ? "border-border-strong bg-hover text-ink" : "border-border text-muted hover:bg-hover hover:text-ink"}`} href={value === "all" ? "/integrations" : `/integrations?show=${value}`} key={value}>{label}<span className="tabular-nums text-muted">{count}</span></Link>; })}</nav>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.map((step) => { const done = step.status === "done"; const optional = step.optional && step.status !== "done"; return <li className={`flex flex-col ${cardClass} p-4`} key={step.key}>
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-ink">{toolIcon(step.key, done)}</span>
          {done ? <Badge tone="success">{step.key === "brand" || step.key === "check" ? "Done" : "Connected"}</Badge> : optional ? <Badge tone="neutral">Optional</Badge> : <SetupStatusBadge status={step.status} />}
        </div>
        <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{step.why}</p>
        <div className="mt-auto pt-4"><Link className={buttonClass(step.key === nextKey ? "primary" : "secondary", "sm", "w-full")} href={step.status === "done" ? `?open=done#step-${step.n}` : `#step-${step.n}`}>{cardLabel(step)}<span className="sr-only"> {step.title}</span></Link></div>
      </li>; })}</ul>
      {shown.length === 0 && <p className={`mt-4 ${cardClass} px-4 py-6 text-center text-sm text-muted`}>{notice.show === "connected" ? "Nothing is connected yet. Start with the first step below." : "Everything is set up. Nice work."}</p>}
    </section>

    <section aria-labelledby="steps-heading" className={`overflow-hidden ${cardClass}`}>
      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight" id="steps-heading">Setup steps{setup.requiredLeft === 0 && <Badge tone="success">You&apos;re all set</Badge>}</h2>
          <p className="text-sm text-muted"><span className="tabular-nums">{required - setup.requiredLeft} of {required}</span> steps done{optionalCount > 0 && <>, plus <span className="tabular-nums">{optionalCount}</span> optional</>}</p>
        </div>
        <div className="mt-3"><Progress label="Setup progress" max={required} value={required - setup.requiredLeft} /></div>
        
      </div>
      <ol className="border-t border-border">
        {setup.steps.filter((step) => step.status !== "done").map((step) => <SetupStepCard key={step.key} note={notes[step.key]} step={step}>{actions[step.key]}</SetupStepCard>)}
      </ol>
      {setup.steps.some((step) => step.status === "done") && <details className="group border-t border-border" open={notice.open === "done"}>
        <summary className="flex min-h-10 cursor-pointer items-center px-4 text-sm text-muted hover:text-ink sm:px-5">Done ({setup.steps.filter((step) => step.status === "done").length}): show or change</summary>
        <ol className="border-t border-border">{setup.steps.filter((step) => step.status === "done").map((step) => <SetupStepCard key={step.key} note={notes[step.key]} step={step}>{actions[step.key]}</SetupStepCard>)}</ol>
      </details>}
    </section>

    <details className={`mt-8 overflow-hidden ${cardClass}`}>
      <summary className={`flex cursor-pointer items-start gap-3 px-4 py-4 hover:bg-hover sm:px-5 ${setupUi.focus}`}><ChevronRight className="chev mt-1 shrink-0 text-muted" size={14} /><span className="min-w-0"><h2 className="text-base font-semibold tracking-tight">More settings</h2><span className="block text-sm text-muted">Pull request checks, Figma plugin and connection details</span></span></summary>
      <div className="divide-y divide-border border-t border-border text-sm">
        <section aria-labelledby="gh-more" className="px-4 py-5 sm:px-5">
          <h3 className="text-sm font-semibold" id="gh-more">GitHub checks</h3>
          {github?.repo ? <>
            <form action={saveWatchPullsAction} className="mt-3 grid gap-3">
              <label className="flex items-start gap-2.5"><input className="mt-0.5" defaultChecked={watchesPulls(brand.id)} name="watch" type="checkbox" />Check new pull requests and comment when they add off-brand values</label>
              <label className="flex items-start gap-2.5"><input className="mt-0.5" defaultChecked={schedulesAudits(brand.id)} name="schedule" type="checkbox" />Check the repository every day</label>
              <span className={`${help} text-xs`}>Checks only look. Nothing changes, and results show up in Reviews.</span>
              <div><SubmitButton className={setupUi.secondary} pendingLabel="Saving…">Save checks</SubmitButton></div>
            </form>
            <form action={runRepoAuditAction} className="mt-3"><SubmitButton className={setupUi.secondary} pendingLabel="Checking…">Check the repository now</SubmitButton></form>
          </> : <p className="mt-2 text-muted">Connect GitHub and choose a repository in step 2 first.</p>}
        </section>
        <section aria-labelledby="figma-more" className="px-4 py-5 sm:px-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold" id="figma-more">Figma plugin <Badge tone="neutral">Coming soon</Badge></h3>
          <p className="mt-1 text-muted">Another way to connect Figma, without Claude. Not yet tested in Figma, so treat its edits as untested.</p>
          <FigmaPluginCard />
        </section>
        <section aria-labelledby="conn-more" className="px-4 py-5 sm:px-5">
          <h3 className="text-sm font-semibold" id="conn-more">Connection details</h3>
          <ul className="mt-3 divide-y divide-border rounded-control border border-border">{integrations.map((i) => <li className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2" key={i.provider}><span className="inline-flex items-center gap-2 font-medium"><ProviderIcon connected={i.connection_status === "connected"} provider={i.provider} size={14} />{providerName(i.provider)}</span><span className="text-xs text-muted">{i.provider === "switch" ? (roomReplies > 0 ? "Connected" : "Not connected") : connectionLabel(i.connection_status)} · <span className="tabular-nums">{i.last_checked_at ? `last used ${whenText(i.last_checked_at)}` : "not used yet"}</span></span></li>)}</ul>
        </section>
      </div>
    </details>
    </div>
  </main>;
}
