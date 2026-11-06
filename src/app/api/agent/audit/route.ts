import { NextRequest } from "next/server";
import { z } from "zod";
import { runAudit } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ brandId: z.string().uuid().optional() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => runAudit(ctx, body.parse(await jsonBody(request)))); }
