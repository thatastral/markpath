import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";

/** "Issues · Nexa · Markpath": the page, then the workspace, then the app. */
export async function pageTitle(page: string): Promise<string> {
  try {
    const userId = await currentUserId();
    if (!userId) return `${page} · Markpath`;
    const db = getDatabase(); initializeSchema(db);
    const brand = await activeBrandForUser(db, userId);
    return brand ? `${page} · ${brand.name} · Markpath` : `${page} · Markpath`;
  } catch { return `${page} · Markpath`; }
}
