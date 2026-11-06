import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { logout } from "./actions";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await currentUserId())) redirect("/login");
  return <div className="min-h-screen"><header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><a className="font-semibold" href="/">Markpath</a><form action={logout}><button className="text-sm text-muted underline" type="submit">Sign out</button></form></div></header>{children}</div>;
}
