import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { watchesPulls } from "./github";
import { checkNewPullRequests, runScheduledAuditIfDue } from "./vet";

/** Polls connected repositories for new pull requests every minute (no public URL or webhook needed). Off with MARKPATH_PR_WATCH=off. */
/** One pass over every connected repository: new pull requests and any audit that is due. Used by the timer and by the Vercel cron route. */
export async function prWatchTick() {
    try {
      const db = getDatabase(); initializeSchema(db);
      for (const row of db.prepare("SELECT brand_id FROM integration_secrets WHERE provider = 'github'").all() as Array<{ brand_id: string }>) { if (watchesPulls(row.brand_id)) await checkNewPullRequests(row.brand_id).catch(() => undefined); await runScheduledAuditIfDue(row.brand_id).catch(() => undefined); }
    } catch { /* the next tick tries again */ }
}

export function startPrWatcher() {
  const g = globalThis as unknown as { __mpPrWatch?: boolean };
  // On Vercel there is no long-running process: /api/cron/pr-watch (vercel.json) runs the same pass instead.
  if (g.__mpPrWatch || process.env.MARKPATH_PR_WATCH === "off" || process.env.VERCEL) return; g.__mpPrWatch = true;
  const every = Math.max(30, Number(process.env.MARKPATH_PR_WATCH_INTERVAL_SECONDS ?? 60)) * 1000;
  setTimeout(prWatchTick, 5_000); setInterval(prWatchTick, every).unref?.();
}
