import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { logout } from "./actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await currentUserId())) redirect("/login");
  return <div className="min-h-screen"><header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4"><nav className="flex flex-wrap items-center gap-x-4 gap-y-2"><Link className="font-semibold" href="/">Markpath</Link><Link className="text-sm text-muted underline" href="/brand">Brand profile</Link><Link className="text-sm text-muted underline" href="/integrations">Integrations</Link><Link className="text-sm text-muted underline" href="/issues">Issues & approvals</Link><Link className="text-sm text-muted underline" href="/activity">Agent activity</Link></nav><form action={logout}><button className="text-sm text-muted underline" type="submit">Sign out</button></form></div></header>{children}</div>;
}
