import { NextRequest } from "next/server";
import { z } from "zod";
import { contrastCheck } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const hex = z.string().regex(/^#?[0-9a-fA-F]{6}$/);
const body = z.object({ pairs: z.array(z.object({ label: z.string().max(200), foreground: hex, background: hex, fontSize: z.number().positive().max(2000).optional(), bold: z.boolean().optional() })).min(1).max(300) });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => contrastCheck(ctx, body.parse(await jsonBody(request)))); }
