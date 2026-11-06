import { NextRequest } from "next/server";
import { z } from "zod";
import { figmaVerification } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ taskId: z.string().uuid(), counts: z.object({ colour: z.number().int().min(0), typeface: z.number().int().min(0), radius: z.number().int().min(0) }), checkedNodeIds: z.array(z.string().max(60)).max(200).optional(), note: z.string().max(300).optional() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => figmaVerification(ctx, body.parse(await jsonBody(request)))); }
