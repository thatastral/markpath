import { NextResponse } from "next/server";
import { HttpSwitchClient } from "@/server/switch/client";

export const runtime = "nodejs";

export async function GET() {
  const health = await new HttpSwitchClient().health();
  return NextResponse.json(health, { status: health.connected ? 200 : 503 });
}
