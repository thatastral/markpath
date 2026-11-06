import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyTask } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ taskId: z.string().uuid() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => verifyTask(ctx, body.parse(await jsonBody(request)))); }
