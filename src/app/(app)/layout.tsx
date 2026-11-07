import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserById } from "@/server/db/repositories";
import { activeBrandForUser, listBrandsForUser } from "@/server/workspace/active";
import { getApprovals } from "@/server/dashboard/service";
import { getSetupData, type SetupData } from "@/server/dashboard/setup";
import { MainNav } from "@/components/main-nav";
import { AppShell } from "@/components/header-menu";
import { CheckIcon, ChevronDown, LogoutIcon, PlusIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/ui/submit-button";
import { cookies } from "next/headers";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { readTheme } from "@/components/theme/read-theme";
import { SIDEBAR_COOKIE } from "@/components/header-menu";
import { logout, switchWorkspace } from "./actions";
import { CurrentPathInput, WorkspaceMenu } from "./workspace-menu";

const tile = "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-2xs font-semibold";
const menuRow = "flex min-h-10 w-full items-center gap-2 rounded-control px-2 text-left text-sm hover:bg-hover lg:min-h-8";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await currentUserId();
  if (!userId) redirect("/welcome"); // signed-out visitors see the landing page
  const db = getDatabase(); initializeSchema(db);
  const user = findUserById(db, userId);
  if (!user) redirect("/login"); // a stale cookie for a user that no longer exists
  const brands = listBrandsForUser(db, userId); const active = await activeBrandForUser(db, userId);
  if (active && !(db.prepare("SELECT onboarded_at FROM brands WHERE id = ?").get(active.id) as { onboarded_at: string | null } | undefined)?.onboarded_at) redirect("/onboarding"); // new workspaces are set up first
  const pending = active ? getApprovals(db, active.id).filter((a) => a.decision === "pending").length : 0;
  // Sidebar "Getting started" pill (Attio, Langdock). Never let a slow Switch health check hold up the page.
  const setup = active ? await Promise.race([getSetupData(db, active.id, userId), new Promise<null>((r) => setTimeout(() => r(null), 800))]).catch(() => null) as SetupData | null : null;
  const required = setup ? setup.steps.filter((s) => !s.optional).length : 0; const doneSteps = setup ? required - setup.requiredLeft : 0;
  const theme = await readTheme(); const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";
  const initial = (s: string) => s.trim().charAt(0).toUpperCase() || "M";

  const sidebar = <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3 pt-14 lg:px-2 lg:pt-2">
    <WorkspaceMenu className="relative" summary={<summary className="press flex min-h-10 cursor-pointer items-center gap-2 rounded-control px-2 hover:bg-hover lg:min-h-8">
        <span aria-hidden className={`${tile} bg-brand-solid text-white`}>{initial(active?.name ?? "Markpath")}</span>
        <span className="sb-text min-w-0 truncate text-sm font-semibold" title={active?.name ?? "Markpath"}>{active?.name ?? "Markpath"}</span>
        <ChevronDown aria-hidden className="sb-hide shrink-0 text-muted" size={14} />
        <span className="sr-only">Workspace menu</span>
      </summary>}>
      <div className="sb-menu absolute inset-x-0 top-full z-50 mt-1 rounded-panel border border-border bg-surface p-1 shadow-pop">
        <p className="px-2 pb-1 pt-1.5 text-2xs font-medium text-muted">Workspaces</p>
        {brands.length > 1
          ? <form action={switchWorkspace}><CurrentPathInput />{brands.map((b) => <button className={menuRow} key={b.id} name="brandId" type="submit" value={b.id}><span aria-hidden className={`${tile} bg-hover text-muted`}>{initial(b.name)}</span><span className="min-w-0 flex-1 truncate" title={b.name}>{b.name}</span>{b.id === active?.id && <CheckIcon className="text-ink" size={14} />}<span className="sr-only">{b.id === active?.id ? " (current)" : ", switch to this workspace"}</span></button>)}</form>
          : active && <p className={menuRow}><span aria-hidden className={`${tile} bg-hover text-muted`}>{initial(active.name)}</span><span className="min-w-0 flex-1 truncate">{active.name}</span><CheckIcon className="text-ink" size={14} /></p>}
        <div className="my-1 border-t border-border" />
        <Link className={`${menuRow} text-muted hover:text-ink`} href="/workspaces/new"><PlusIcon size={14} />New workspace</Link>
      </div>
    </WorkspaceMenu>
    <MainNav pending={pending} />
    <div className="mt-auto grid gap-3">
    {setup && setup.requiredLeft > 0 && <Link className="sb-hide press block rounded-panel border border-border bg-surface px-3 py-2.5 hover:border-border-strong" href="/integrations">
      <span className="flex items-center justify-between gap-2 text-sm font-medium">Getting started<span className="text-xs font-normal tabular-nums text-muted">{doneSteps} of {required} steps</span></span>
      <span className="mt-0.5 block truncate text-xs text-muted">Next: {setup.steps.find((s) => s.status !== "done" && !s.optional)?.title ?? "finish setup"}</span>
      <span aria-hidden className="mt-2 block h-1 overflow-hidden rounded-full bg-hover"><span className="progress-fill block h-full w-full rounded-full bg-brand-solid" style={{ transform: `scaleX(${doneSteps / Math.max(1, required)})` }} /></span>
    </Link>}
    <div className="grid gap-px border-t border-border pt-3">
      <p className="flex min-h-10 items-center gap-2 px-2 lg:min-h-8"><span aria-hidden className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-hover text-2xs font-semibold text-muted ring-1 ring-inset ring-border-strong">{initial(user.name || user.email)}</span><span className="sb-text min-w-0 truncate text-sm" title={user.email}><span className="sr-only">Signed in as </span>{user.name || user.email}</span></p>
      <div className="sb-hide px-2 pb-1"><ThemeSwitcher className="w-full" initial={theme} /></div>
      <form action={logout}><SubmitButton className={`${menuRow} text-muted hover:text-ink`} align="start" pendingLabel={<span className="sb-text">Signing out…</span>} title="Sign out"><LogoutIcon size={16} /><span className="sb-text">Sign out</span></SubmitButton></form>
    </div>
    </div>
  </div>;

  return <div className="min-h-dvh">
    <a className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-pop" href="#content">Skip to content</a>
    <AppShell collapsedInitial={collapsed} sidebar={sidebar} workspace={active?.name} workspaceInitial={initial(active?.name ?? "Markpath")}>
      <div id="content" tabIndex={-1}>{children}</div>
    </AppShell>
  </div>;
}
