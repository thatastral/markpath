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
import { runRepoAuditAction, saveCanvaDesignAction, saveWatchPullsAction, saveChatHandle, saveFigmaFileAction, saveTeamPrefix } from "./actions";

const label = "font-medium";
const help = "text-muted";
const field = "grid gap-1 text-sm";
const row = "flex flex-wrap gap-2";
const CONNECTORS = "https://claude.ai/settings/connectors";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ saved?: string; problem?: string }> }) {
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
      <div className="rounded-[var(--radius-control)] border border-border bg-canvas p-3">
        <p className={label}>Test it</p>
        <p className="mt-1">Send this in the room. This step turns green when an agent answers.</p>
        <p className="mt-2"><SetupCopyButton label="test message" value={`@${teamPrefix}-director what's the status?`} /></p>
        {roomReplies > 0 && <p className="mt-1 text-green-800">Agents have answered {roomReplies === 1 ? "once" : `${roomReplies} times`} so far.</p>}
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

  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <SetupClearNotice />
    <p className="text-sm font-semibold text-brand">Integrations</p>
    <h1 className="mt-2 text-3xl font-semibold">Set up your tools</h1>
    <p className="mt-2 max-w-2xl text-muted">Work through these steps in order. Each one turns green only after Markpath has really used it, so green means it works.</p>
    {notice.saved && <p className="mt-4 rounded-[var(--radius-control)] border border-border bg-surface px-4 py-3 text-sm" role="status">{notice.saved}</p>}
    {notice.problem && <p className="mt-4 rounded-[var(--radius-control)] border border-danger px-4 py-3 text-sm text-danger" role="alert">{notice.problem}</p>}

    <section aria-labelledby="steps-heading" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold" id="steps-heading">Setup steps <span className="text-sm font-normal text-muted">· {required - setup.requiredLeft} of {required} needed steps done{setup.requiredLeft === 0 ? ". You're all set." : ""}</span></h2>
        <SetupRefreshButton />
      </div>
      <p className="mt-1 text-sm text-muted">Finished something in another app? Select Check again to update these.</p>
      <ol className="mt-4 grid gap-3">
        {setup.steps.map((step) => <SetupStepCard key={step.key} note={notes[step.key]} step={step}>{actions[step.key]}</SetupStepCard>)}
      </ol>
    </section>

    <details className="mt-10 rounded-lg border border-border bg-surface">
      <summary className={`cursor-pointer rounded-lg p-4 ${setupUi.focus}`}><h2 className="inline text-lg font-semibold">More settings</h2><span className="ml-2 text-sm text-muted">Pull request checks, Figma plugin, connection details</span></summary>
      <div className="grid gap-8 border-t border-border p-4 text-sm">
        <section aria-labelledby="gh-more">
          <h3 className="font-semibold" id="gh-more">GitHub checks</h3>
          {github?.repo ? <>
            <form action={saveWatchPullsAction} className="mt-2 grid gap-3">
              <label className="flex items-start gap-2"><input className="mt-0.5" defaultChecked={watchesPulls(brand.id)} name="watch" type="checkbox" />Check new pull requests and comment when they add off-brand values</label>
              <label className="flex items-start gap-2"><input className="mt-0.5" defaultChecked={schedulesAudits(brand.id)} name="schedule" type="checkbox" />Check the repository every day</label>
              <span className={help}>Pull requests are checked every minute. Review only: nothing is changed, and results appear under Reviews.</span>
              <div><button className={setupUi.secondary} type="submit">Save</button></div>
            </form>
            <form action={runRepoAuditAction} className="mt-3"><button className={setupUi.secondary} type="submit">Check the repository now</button></form>
          </> : <p className="mt-2 text-muted">Connect GitHub and choose a repository in step 2 first.</p>}
        </section>
        <section aria-labelledby="figma-more">
          <h3 className="font-semibold" id="figma-more">Figma plugin</h3>
          <p className="mt-2 text-muted">An alternative to the Figma connector. It hasn&apos;t been tried in Figma yet, so treat its edits as untested.</p>
          <FigmaPluginCard />
        </section>
        <section aria-labelledby="conn-more">
          <h3 className="font-semibold" id="conn-more">Connection details</h3>
          <ul className="mt-2 grid gap-2">{integrations.map((i) => <li className="flex flex-wrap justify-between gap-x-3 rounded-[var(--radius-control)] border border-border px-3 py-2" key={i.provider}><span className="font-medium">{providerName(i.provider)}</span><span className="text-muted">{i.provider === "switch" ? (roomReplies > 0 ? "Connected" : "Not connected") : connectionLabel(i.connection_status)} · {i.last_checked_at ? `last used ${whenText(i.last_checked_at)}` : "not used yet"}</span></li>)}</ul>
        </section>
      </div>
    </details>
  </main>;
}
