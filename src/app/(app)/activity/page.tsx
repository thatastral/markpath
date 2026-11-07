import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getActivity } from "@/server/dashboard/service";
import { activityText, agentLabel, whenText, withCanvaLabels } from "@/lib/labels";
import { AgentAvatar, buttonClass, EmptyState, GroupBand, PageHeader, rowClass } from "@/components/ui/primitives";
import { ActivityIcon, ChevronRight } from "@/components/ui/icons";

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default async function ActivityPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const rows = getActivity(db, brand.id, 60);
  const days: Array<[string, typeof rows]> = []; for (const r of rows) { const k = dayKey(r.created_at); const last = days[days.length - 1]; if (last && last[0] === k) last[1].push(r); else days.push([k, [r]]); }
  return <main className="anim-rise">
    <PageHeader description="Every request, approval, change and check. Newest first." title="Activity" />
    {rows.length === 0 ? <EmptyState action={<><Link className={buttonClass("primary")} href="/integrations#step-5">Set up the chat room</Link><Link className={buttonClass("secondary")} href="/issues">See issues</Link></>} icon={<ActivityIcon size={28} />} title="No activity yet">Ask the Brand Director something in your chat room. It shows up here.</EmptyState>
      : days.map(([day, list]) => <section aria-label={day} className="-mt-px" key={day}>
        <GroupBand as="h2" count={list.length}>{day}</GroupBand>
        <ol>{list.map((r) => <li className={rowClass} key={r.id}>
          <span className="mt-0.5"><AgentAvatar name={r.agent_name} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="min-w-0 text-sm"><span className="font-medium">{agentLabel(r.agent_name)}</span> <span className="text-muted">{activityText(r.activity_type, r.status)}</span></p>
              <time className="shrink-0 text-xs tabular-nums text-muted" dateTime={r.created_at} title={whenText(r.created_at)}>{timeOf(r.created_at)}</time>
            </div>
            {r.task_description && <p className="mt-0.5 text-sm text-muted">{withCanvaLabels(r.task_description)}</p>}
            {r.message_reference && <details className="text-xs text-muted"><summary className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control hover:text-ink lg:min-h-7"><ChevronRight className="chev" size={12} />Technical details</summary><p className="mb-1 break-all font-mono">Chat message: {r.message_reference}</p></details>}
          </div>
        </li>)}</ol>
      </section>)}
    {rows.length === 60 && <p className="border-t border-border px-4 py-4 text-center text-xs text-muted">Showing the latest <span className="tabular-nums">60</span> entries.</p>}
  </main>;
}
