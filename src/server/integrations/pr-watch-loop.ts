import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { watchesPulls } from "./github";
import { checkNewPullRequests } from "./vet";

/** Polls connected repositories for new pull requests every minute (no public URL or webhook needed). Off with MARKPATH_PR_WATCH=off. */
export function startPrWatcher() {
  const g = globalThis as unknown as { __mpPrWatch?: boolean };
  if (g.__mpPrWatch || process.env.MARKPATH_PR_WATCH === "off") return; g.__mpPrWatch = true;
  const every = Math.max(30, Number(process.env.MARKPATH_PR_WATCH_INTERVAL_SECONDS ?? 60)) * 1000;
  const tick = async () => {
    try {
      const db = getDatabase(); initializeSchema(db);
      for (const row of db.prepare("SELECT brand_id FROM integration_secrets WHERE provider = 'github'").all() as Array<{ brand_id: string }>) if (watchesPulls(row.brand_id)) await checkNewPullRequests(row.brand_id).catch(() => undefined);
    } catch { /* the next tick tries again */ }
  };
  setTimeout(tick, 5_000); setInterval(tick, every).unref?.();
}
