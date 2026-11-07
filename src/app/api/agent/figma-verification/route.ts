import { NextRequest } from "next/server";
import { z } from "zod";
import { figmaVerification } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ taskId: z.string().uuid(), provider: z.enum(["figma", "canva"]).default("figma"), counts: z.record(z.string().max(30), z.number().int().min(0)).refine((c) => Object.keys(c).length > 0 && Object.keys(c).length <= 10, "Provide the counts you measured."), checkedNodeIds: z.array(z.string().max(60)).max(200).optional(), note: z.string().max(300).optional() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => figmaVerification(ctx, body.parse(await jsonBody(request)))); }
