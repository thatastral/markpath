import { NextRequest, NextResponse } from "next/server";
import { prWatchTick } from "@/server/integrations/pr-watch-loop";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Called by Vercel Cron (see vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET" when CRON_SECRET is set.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  await prWatchTick();
  return NextResponse.json({ ok: true });
}
