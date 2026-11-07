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
import { runRepoAuditAction, saveCanvaDesignAction, saveWatchPullsAction, saveChatHandle, saveFigmaFileAction, saveTeamPrefix } from "./actions";

const label = "text-sm font-medium";
const help = "text-muted";
const field = "grid gap-1 text-sm";
const row = "flex flex-wrap gap-2";
const CONNECTORS = "https://claude.ai/settings/connectors";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ saved?: string; problem?: string; show?: string }> }) {
  const notice = await searchParams;
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const setup = await getSetupData(db, brand.id, userId);
  const { teamPrefix, chatHandle, github, figma, canva, switchReachable, roomReplies } = setup.context;
  const integrations = getIntegrations(db, brand.id);
  const required = setup.steps.filter((s) => !s.optional).length;

  const actions: Record<SetupKey, ReactNode> = {
    brand: <Link className={setup.steps[0].status === "needs_you" ? setupUi.primary : setupUi.secondary} href="/brand">{setup.steps[0].status === "done" ? "Open brand rules" : setup.steps[0].status === "needs_you" ? "Review and approve rules" : "Upload your guideline"}</Link>,

    github: <GithubConnect login={github?.login ?? null} repo={github?.repo ?? null} />,

    figma: <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><SetupExternalLink href={CONNECTORS}>Connect Figma in Claude</SetupExternalLink>{figma && <SetupExternalLink href={figma.url}>Open the file</SetupExternalLink>}</div>
      <form action={saveFigmaFileAction} className={field}>
      <label className={label} htmlFor="figma-link">Figma file link</label>
      <div className={row}><input className={`${setupUi.input} sm:flex-1`} defaultValue={figma?.url ?? ""} id="figma-link" name="link" placeholder="https://www.figma.com/design/…" inputMode="url" type="text" /><button className={setupUi.primary} type="submit">Save file</button></div>
      <span className={help}>{figma ? "To stop using this file, clear the link and save." : "Open the file in Figma, copy the address from your browser and paste it here."}</span>
      </form>
    </div>,

    canva: <div className="grid gap-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><SetupExternalLink href={CONNECTORS}>Connect Canva in Claude</SetupExternalLink>{canva && <SetupExternalLink href={canva.url}>Open the design</SetupExternalLink>}</div>
      <form action={saveCanvaDesignAction} className={field}>
      <label className={label} htmlFor="canva-link">Canva design link</label>
      <div className={row}><input className={`${setupUi.input} sm:flex-1`} defaultValue={canva?.url ?? ""} id="canva-link" name="link" placeholder="https://www.canva.com/design/…" inputMode="url" type="text" /><button className={setupUi.primary} type="submit">Save design</button></div>
      <span className={help}>{canva ? "To stop using this design, clear the link and save." : "Open the design in Canva, copy the address from your browser and paste it here."}</span>
      </form>
    </div>,

    chat: <div className="grid gap-5 text-sm">
      <p><span className="font-medium">Which chat app?</span> Discord or Slack are quickest. Telegram works too. Teams needs your IT admin.</p>
      <p className={help}>{switchReachable ? "Markpath can reach Switch, the service that runs your chat room." : "Markpath can't reach Switch, the service that runs your chat room. Start Switch, then reload this page."}</p>
      <form action={saveTeamPrefix} className={field}>
        <label className={label} htmlFor="prefix">1. Name your agents</label>
        <div className={row}><input className={`${setupUi.input} sm:max-w-xs`} defaultValue={teamPrefix} id="prefix" name="prefix" /><button className={setupUi.secondary} type="submit">Save name</button></div>
        <span className={help}>Set this before step 2. Changing it later means making a new room. Your agents will be called:</span>
        <span className="flex flex-wrap gap-x-4 gap-y-2">{["director", "design"].map((role) => <SetupCopyButton key={role} label={`agent name ${teamPrefix}-${role}`} value={`@${teamPrefix}-${role}`} />)}</span>
      </form>
      <div className="grid gap-2">
        <p className={label}>2. Copy the room template</p>
        <p className={help}>It already holds this workspace&apos;s agent keys. In Switch Console, create a room and paste it in. No files or scripts.</p>
        <CopyRoomTemplate />
      </div>
      <div><p className={label}>3. Connect your chat app</p><ChatApps /></div>
      <form action={saveChatHandle} className={field}>
        <label className={label} htmlFor="handle">4. Your chat username</label>
        <div className={row}><input className={`${setupUi.input} sm:max-w-xs`} defaultValue={chatHandle} id="handle" name="handle" placeholder="your-username" /><button className={setupUi.secondary} type="submit">Save username</button></div>
        <span className={help}>Your username in the chat app, without the @. Lets you approve changes by replying in the room.</span>
      </form>
      <div className="rounded-control border border-border bg-surface p-4">
        <p className={label}>Test it</p>
        <p className="mt-1">Send this in the room. This step turns green when an agent answers.</p>
        <p className="mt-2"><SetupCopyButton label="test message" value={`@${teamPrefix}-director what's the status?`} /></p>
        {roomReplies > 0 && <p className="mt-2 text-success">Agents have answered {roomReplies === 1 ? "once" : `${roomReplies} times`} so far.</p>}
      </div>
    </div>,

    check: <div className="flex flex-wrap items-center gap-3 text-sm">
      {github?.repo && <form action={runRepoAuditAction}><button className={setup.steps[5].status === "done" ? setupUi.secondary : setupUi.primary} type="submit">Check {github.repo} now</button></form>}
      <Link className={setupUi.secondary} href="/reviews">See results</Link>
    </div>,
  };

  const notes: Partial<Record<SetupKey, ReactNode>> = {
    figma: "Needs the Figma connector signed in where your agents run, and edit access to the file (paid Figma seat). Skip this to use the built-in sample file.",
    canva: "Edits run as the Canva account connected to the agents. Colours and wording only, not fonts.",
  };

  const connected = setup.steps.filter((x) => x.status === "done"); const open = setup.steps.filter((x) => x.status !== "done");
  const chips: Array<[string, string, number]> = [["All", "all", setup.steps.length], ["Connected", "connected", connected.length], ["Needs setup", "setup", open.length]];
  const shown = notice.show === "connected" ? connected : notice.show === "setup" ? open : setup.steps;
  const toolIcon = (key: SetupKey) => key === "brand" ? <BrandIcon /> : key === "check" ? <EyeCheckIcon /> : <ProviderIcon provider={key === "chat" ? "switch" : key} />;
  return <main className="anim-rise">
    <SetupClearNotice />
    <PageHeader actions={<SetupRefreshButton />} description="Work through these steps in order. Each one turns green only after Markpath has really used it, so green means it works." title="Integrations" />
    <div className={bodyClass}>
    {(notice.saved || notice.problem) && <div className="mb-6 grid gap-2">
      {notice.saved && <Notice role="status" tone="success">{notice.saved}</Notice>}
      {notice.problem && <Notice role="alert" tone="danger">{notice.problem}</Notice>}
    </div>}

    <section aria-labelledby="tools-grid-heading" className="mb-10">
      <SectionHeading description="Each tool turns Connected only after Markpath has used it." id="tools-grid-heading" title="Your tools" />
      <nav aria-label="Filter tools" className="mt-3 flex flex-wrap gap-1">{chips.map(([label, value, count]) => { const on = (notice.show ?? "all") === value; return <Link aria-current={on ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium lg:min-h-7 ${on ? "border-border-strong bg-hover text-ink" : "border-border text-muted hover:bg-hover hover:text-ink"}`} href={value === "all" ? "/integrations" : `/integrations?show=${value}`} key={value}>{label}<span className="tabular-nums text-muted">{count}</span></Link>; })}</nav>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.map((step) => <li className={`flex flex-col ${cardClass} p-4`} key={step.key}>
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-ink">{toolIcon(step.key)}</span>
          <Link className={buttonClass(step.status === "done" ? "secondary" : step.status === "needs_you" ? "primary" : "secondary", "sm")} href={`#step-${step.n}`}>{step.status === "done" ? "Manage" : step.key === "brand" || step.key === "check" ? "Set up" : "Connect"}<span className="sr-only"> {step.title}</span></Link>
        </div>
        <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{step.why}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">{step.status === "done" ? <Badge tone="success">Connected</Badge> : <SetupStatusBadge status={step.status} />}{step.optional && <span className="text-xs text-muted">Optional</span>}</div>
      </li>)}</ul>
      {shown.length === 0 && <p className={`mt-4 ${cardClass} px-4 py-6 text-center text-sm text-muted`}>{notice.show === "connected" ? "Nothing is connected yet. Start with the first step below." : "Everything is set up."}</p>}
    </section>

    <section aria-labelledby="steps-heading" className={`overflow-hidden ${cardClass}`}>
      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-tight" id="steps-heading">Set up step by step{setup.requiredLeft === 0 && <Badge tone="success">You&apos;re all set</Badge>}</h2>
          <p className="text-sm text-muted"><span className="tabular-nums">{required - setup.requiredLeft} of {required}</span> needed steps done</p>
        </div>
        <div className="mt-3"><Progress label="Setup progress" max={required} value={required - setup.requiredLeft} /></div>
        <p className="mt-3 text-xs text-muted">Finished something in another app? Select Check again to update these.</p>
      </div>
      <ol className="border-t border-border">
        {setup.steps.map((step) => <SetupStepCard key={step.key} note={notes[step.key]} step={step}>{actions[step.key]}</SetupStepCard>)}
      </ol>
    </section>

    <details className={`mt-8 overflow-hidden ${cardClass}`}>
      <summary className={`flex cursor-pointer items-start gap-3 px-4 py-4 hover:bg-hover sm:px-5 ${setupUi.focus}`}><ChevronRight className="chev mt-1 shrink-0 text-muted" size={14} /><span className="min-w-0"><h2 className="text-base font-semibold tracking-tight">More settings</h2><span className="block text-sm text-muted">Pull request checks, Figma plugin, connection details</span></span></summary>
      <div className="divide-y divide-border border-t border-border text-sm">
        <section aria-labelledby="gh-more" className="px-4 py-5 sm:px-5">
          <h3 className="text-sm font-semibold" id="gh-more">GitHub checks</h3>
          {github?.repo ? <>
            <form action={saveWatchPullsAction} className="mt-3 grid gap-3">
              <label className="flex items-start gap-2.5"><input className="mt-0.5" defaultChecked={watchesPulls(brand.id)} name="watch" type="checkbox" />Check new pull requests and comment when they add off-brand values</label>
              <label className="flex items-start gap-2.5"><input className="mt-0.5" defaultChecked={schedulesAudits(brand.id)} name="schedule" type="checkbox" />Check the repository every day</label>
              <span className={`${help} text-xs`}>Pull requests are checked every minute. Review only: nothing is changed, and results appear under Reviews.</span>
              <div><button className={setupUi.secondary} type="submit">Save</button></div>
            </form>
            <form action={runRepoAuditAction} className="mt-3"><button className={setupUi.secondary} type="submit">Check the repository now</button></form>
          </> : <p className="mt-2 text-muted">Connect GitHub and choose a repository in step 2 first.</p>}
        </section>
        <section aria-labelledby="figma-more" className="px-4 py-5 sm:px-5">
          <h3 className="text-sm font-semibold" id="figma-more">Figma plugin</h3>
          <p className="mt-1 text-muted">An alternative to the Figma connector. It hasn&apos;t been tried in Figma yet, so treat its edits as untested.</p>
          <FigmaPluginCard />
        </section>
        <section aria-labelledby="conn-more" className="px-4 py-5 sm:px-5">
          <h3 className="text-sm font-semibold" id="conn-more">Connection details</h3>
          <ul className="mt-3 divide-y divide-border rounded-control border border-border">{integrations.map((i) => <li className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2" key={i.provider}><span className="inline-flex items-center gap-2 font-medium"><ProviderIcon className="text-muted" provider={i.provider} size={14} />{providerName(i.provider)}</span><span className="text-xs text-muted">{i.provider === "switch" ? (roomReplies > 0 ? "Connected" : "Not connected") : connectionLabel(i.connection_status)} · {i.last_checked_at ? `last used ${whenText(i.last_checked_at)}` : "not used yet"}</span></li>)}</ul>
        </section>
      </div>
    </details>
    </div>
  </main>;
}
