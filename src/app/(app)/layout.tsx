import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserById } from "@/server/db/repositories";
import { activeBrandForUser, listBrandsForUser } from "@/server/workspace/active";
import { HomeLink, MainNav } from "@/components/main-nav";
import { HeaderMenu } from "@/components/header-menu";
import { logout, switchWorkspace } from "./actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  if (!findUserById(db, userId)) redirect("/login"); // a stale cookie for a user that no longer exists
  const brands = listBrandsForUser(db, userId); const active = await activeBrandForUser(db, userId);
  return <div className="min-h-screen"><a className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow" href="#content">Skip to content</a><header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 sm:py-4"><HomeLink /><HeaderMenu><MainNav /><div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">{brands.length > 1 && <form action={switchWorkspace} className="flex items-center gap-2"><label className="sr-only" htmlFor="ws">Workspace</label><select className="max-w-[12rem] rounded-[var(--radius-control)] border border-border bg-surface px-2 py-1 text-sm" defaultValue={active?.id} id="ws" name="brandId">{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><button className="text-sm text-muted underline" type="submit">Switch</button></form>}<Link className="py-1 text-sm text-muted underline" href="/workspaces/new">New workspace</Link><form action={logout}><button className="py-1 text-sm text-muted underline" type="submit">Sign out</button></form></div></HeaderMenu></div></header><div id="content" tabIndex={-1}>{children}</div></div>;
}
