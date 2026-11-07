import { NextRequest } from "next/server";
import { z } from "zod";
import { vetReport } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ kind: z.enum(["figma", "canva"]), target: z.string().min(1).max(300), counts: z.record(z.string().max(30), z.number().int().min(0)).refine((c) => Object.keys(c).length > 0 && Object.keys(c).length <= 10), items: z.array(z.string().max(200)).max(30).optional(), note: z.string().max(300).optional() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => vetReport(ctx, body.parse(await jsonBody(request)))); }
