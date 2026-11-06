import { NextRequest } from "next/server";
import { handleAgent } from "@/server/agents/http";
import { AgentApiError } from "@/server/agents/operations";
import { getDatabase } from "@/server/db/client";
import { initializeSchema } from "@/server/db/schema";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return handleAgent(request, (ctx) => {
    const db = getDatabase(); initializeSchema(db);
    const brand = db.prepare("SELECT id, name, brand_version, brand_specification FROM brands WHERE id = ?").get(ctx.brandId);
    if (!brand) throw new AgentApiError("Brand not found.", 404);
    return { brand };
  });
}
