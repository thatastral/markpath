import { NextResponse } from "next/server";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { GithubError } from "./github-client";

/** Session-authenticated and owner-only: connecting integrations changes what Markpath can touch. */
export async function withOwner(run: (ctx: { brandId: string; userId: string }) => Promise<unknown>) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId);
  if (!brand) return NextResponse.json({ error: "No workspace." }, { status: 404 });
  const role = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (role?.role !== "owner") return NextResponse.json({ error: "Only the workspace owner can change integrations." }, { status: 403 });
  try { return NextResponse.json(await run({ brandId: brand.id, userId })); }
  catch (error) {
    if (error instanceof GithubError) return NextResponse.json({ error: error.message }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 });
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
}
