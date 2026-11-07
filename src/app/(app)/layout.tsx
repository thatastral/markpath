import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserById } from "@/server/db/repositories";
import { activeBrandForUser, listBrandsForUser } from "@/server/workspace/active";
import { HomeLink, MainNav } from "@/components/main-nav";
import { HeaderMenu } from "@/components/header-menu";
import { buttonClass } from "@/components/ui/primitives";
import { PlusIcon } from "@/components/ui/icons";
import { logout, switchWorkspace } from "./actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  if (!findUserById(db, userId)) redirect("/login"); // a stale cookie for a user that no longer exists
  const brands = listBrandsForUser(db, userId); const active = await activeBrandForUser(db, userId);
  const field = "max-w-[12rem] rounded-control border border-border-strong bg-surface px-2 text-sm";
  const quiet = "inline-flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-sm font-medium text-muted hover:bg-subtle hover:text-ink sm:min-h-9 sm:w-auto";
  return <div className="min-h-screen">
    <a className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-pop" href="#content">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <HomeLink />
        <HeaderMenu>
          <MainNav />
          <div className="flex flex-col items-stretch gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1 sm:border-0 sm:pt-0">
            {brands.length > 1 && <form action={switchWorkspace} className="flex items-center gap-2"><label className="sr-only" htmlFor="ws">Workspace</label><select className={field} defaultValue={active?.id} id="ws" name="brandId">{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><button className={buttonClass("secondary", "sm")} type="submit">Switch</button></form>}
            {active && brands.length <= 1 && <span className="hidden items-center gap-2 px-2 text-sm text-muted lg:inline-flex"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />{active.name}</span>}
            <Link className={quiet} href="/workspaces/new"><PlusIcon />New workspace</Link>
            <form action={logout}><button className={quiet} type="submit">Sign out</button></form>
          </div>
        </HeaderMenu>
      </div>
    </header>
    <div id="content" tabIndex={-1}>{children}</div>
  </div>;
}
