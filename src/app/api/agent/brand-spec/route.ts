import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasValidAgentToken } from "@/server/agents/auth";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

export const runtime = "nodejs";
const requestSchema = z.object({ brandId: z.string().uuid() });
export async function GET(request: NextRequest) {
  if (!hasValidAgentToken(request.headers.get("authorization"))) return NextResponse.json({ error: "Agent API is not configured or token is invalid." }, { status: 401 });
  const parsed = requestSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams)); if (!parsed.success) return NextResponse.json({ error: "A valid brandId is required." }, { status: 400 });
  const db = getDatabase(); initializeSchema(db); const brand = db.prepare("SELECT id, name, brand_version, brand_specification FROM brands WHERE id = ?").get(parsed.data.brandId);
  return brand ? NextResponse.json({ brand }) : NextResponse.json({ error: "Brand not found." }, { status: 404 });
}
