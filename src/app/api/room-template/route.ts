import { NextRequest, NextResponse } from "next/server";
import { currentUserId } from "@/server/auth/session";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
import { activeBrandForUser } from "@/server/workspace/active";
import { buildRoomTemplate } from "@/server/tokens/room-template";

export const runtime = "nodejs";
// Session-authenticated and owner-only. Re-issues the same agent keys unless {"rotate": true} is sent, so existing agents keep working.
export async function POST(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = getDatabase(); initializeSchema(db);
  const brand = await activeBrandForUser(db, userId);
  if (!brand) return NextResponse.json({ error: "No workspace." }, { status: 404 });
  const membership = db.prepare("SELECT role FROM memberships WHERE user_id = ? AND brand_id = ?").get(userId, brand.id) as { role: string } | undefined;
  if (membership?.role !== "owner") return NextResponse.json({ error: "Only the workspace owner can set up the chat room." }, { status: 403 });
  const rotate = ((await request.json().catch(() => ({}))) as { rotate?: boolean }).rotate === true;
  const { yaml, rotated } = await buildRoomTemplate(brand.id, request.nextUrl.origin, { rotate });
  return new NextResponse(yaml, { headers: { "Content-Type": "text/yaml; charset=utf-8", "Cache-Control": "no-store", "X-Keys-Rotated": String(rotated) } });
}
