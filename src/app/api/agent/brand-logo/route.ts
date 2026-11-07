import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/server/agents/auth";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";
export const runtime = "nodejs";
// The approved reference logo, so an agent can compare logos in a design against it. Design and QA only.
export async function GET(request: NextRequest) {
  const ctx = authenticateAgent(request.headers.get("authorization"));
  if (!ctx) return NextResponse.json({ error: "Agent API is not configured or the token is invalid." }, { status: 401 });
  if (ctx.role !== "design" && ctx.role !== "qa") return NextResponse.json({ error: "Only the Design agent and Brand QA can fetch the reference logo." }, { status: 403 });
  const db = getDatabase(); initializeSchema(db);
  const row = db.prepare("SELECT storage_path, content_type FROM brand_assets WHERE brand_id = ? AND kind = 'logo' ORDER BY created_at DESC LIMIT 1").get(ctx.brandId) as { storage_path: string; content_type: string } | undefined;
  if (!row) return NextResponse.json({ error: "No reference logo has been uploaded for this workspace." }, { status: 404 });
  return new NextResponse(new Uint8Array(await readFile(row.storage_path)), { headers: { "Content-Type": row.content_type, "Cache-Control": "no-store" } });
}
