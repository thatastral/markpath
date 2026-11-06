import { NextRequest } from "next/server";
import { z } from "zod";
import { executeTarget } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ taskId: z.string().uuid(), target: z.enum(["github", "figma"]) });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => executeTarget(ctx, body.parse(await jsonBody(request)))); }
