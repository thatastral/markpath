import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { findUserById } from "@/server/db/repositories";
import { activeBrandForUser, listBrandsForUser } from "@/server/workspace/active";
import { logout, switchWorkspace } from "./actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db);
  if (!findUserById(db, userId)) redirect("/login"); // a stale cookie for a user that no longer exists
  const brands = listBrandsForUser(db, userId); const active = await activeBrandForUser(db, userId);
  return <div className="min-h-screen"><header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4"><nav className="flex flex-wrap items-center gap-x-4 gap-y-2"><Link className="font-semibold" href="/">Markpath</Link><Link className="text-sm text-muted underline" href="/brand">Brand profile</Link><Link className="text-sm text-muted underline" href="/integrations">Integrations</Link><Link className="text-sm text-muted underline" href="/issues">Issues & approvals</Link><Link className="text-sm text-muted underline" href="/activity">Agent activity</Link></nav><div className="flex flex-wrap items-center gap-3">{brands.length > 1 && <form action={switchWorkspace} className="flex items-center gap-1"><label className="sr-only" htmlFor="ws">Workspace</label><select className="rounded-[var(--radius-control)] border border-border bg-surface px-2 py-1 text-sm" defaultValue={active?.id} id="ws" name="brandId">{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><button className="text-sm text-muted underline" type="submit">Switch</button></form>}<Link className="text-sm text-muted underline" href="/workspaces/new">New workspace</Link><form action={logout}><button className="text-sm text-muted underline" type="submit">Sign out</button></form></div></div></header>{children}</div>;
}
