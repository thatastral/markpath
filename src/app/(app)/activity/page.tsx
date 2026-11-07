import { redirect } from "next/navigation";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { getActivity } from "@/server/dashboard/service";
import { activityText, agentLabel, whenText, withCanvaLabels } from "@/lib/labels";
import { AgentAvatar, cardClass, EmptyState, PageHeader } from "@/components/ui/primitives";
import { ActivityIcon, ChevronRight } from "@/components/ui/icons";

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default async function ActivityPage() {
  const userId = await currentUserId(); if (!userId) redirect("/login");
  const db = getDatabase(); initializeSchema(db); const brand = await activeBrandForUser(db, userId); if (!brand) redirect("/");
  const rows = getActivity(db, brand.id, 60);
  const days: Array<[string, typeof rows]> = []; for (const r of rows) { const k = dayKey(r.created_at); const last = days[days.length - 1]; if (last && last[0] === k) last[1].push(r); else days.push([k, [r]]); }
  return <main className="anim-rise mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
    <PageHeader description="A record of requests, approvals, changes and checks. Newest first." eyebrow="Activity" title="What the agents have done" />
    {rows.length === 0 ? <div className="mt-8"><EmptyState icon={<ActivityIcon size={20} />} title="No activity yet">Ask the Brand Director something in your chat room and it will appear here.</EmptyState></div>
      : <div className="mt-8 grid gap-8">{days.map(([day, list]) => <section aria-label={day} key={day}>
        <h2 className="sticky top-14 z-10 -mx-1 mb-2 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">{day}</h2>
        <ol className={`${cardClass} py-1`}>{list.map((r, idx) => <li className="relative flex gap-3 px-4 py-3" key={r.id}>
          {idx < list.length - 1 && <span aria-hidden className="absolute bottom-0 left-[1.8rem] top-11 w-px bg-border" />}
          <span className="relative"><AgentAvatar name={r.agent_name} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="min-w-0 text-sm"><span className="font-medium">{agentLabel(r.agent_name)}</span> <span className="text-muted">{activityText(r.activity_type, r.status)}</span></p>
              <time className="shrink-0 text-xs tabular-nums text-muted" dateTime={r.created_at} title={whenText(r.created_at)}>{timeOf(r.created_at)}</time>
            </div>
            {r.task_description && <p className="mt-1 text-sm">{withCanvaLabels(r.task_description)}</p>}
            {r.message_reference && <details className="mt-1 text-xs text-muted"><summary className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control hover:text-ink"><ChevronRight className="chev" size={12} />Technical details</summary><p className="mt-1 break-all font-mono">Chat message: {r.message_reference}</p></details>}
          </div>
        </li>)}</ol>
      </section>)}</div>}
    {rows.length === 60 && <p className="mt-6 text-center text-sm text-muted">Showing the latest 60 entries.</p>}
  </main>;
}
