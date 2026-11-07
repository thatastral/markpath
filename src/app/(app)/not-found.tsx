import Link from "next/link";
import { buttonClass, EmptyState, PageHeader } from "@/components/ui/primitives";
import { SearchIcon } from "@/components/ui/icons";

export const metadata = { title: "Page not found · Markpath" };

/** 404 inside the app shell, so the sidebar and workspace menu stay in reach. */
export default function AppNotFound() {
  return <main className="anim-rise">
    <PageHeader title="Page not found" />
    <EmptyState action={<><Link className={buttonClass("primary")} href="/">Go to Overview</Link><Link className={buttonClass("secondary")} href="/issues">See issues</Link></>} icon={<SearchIcon size={28} />} title="We can't find that page">The link may be old, or it may belong to a workspace you're not in. To check another workspace, open the workspace menu at the top of the sidebar.</EmptyState>
  </main>;
}
