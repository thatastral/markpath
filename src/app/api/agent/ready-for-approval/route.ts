import { NextRequest } from "next/server";
import { z } from "zod";
import { readyForApproval } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ taskId: z.string().uuid() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => readyForApproval(ctx, body.parse(await jsonBody(request)).taskId)); }
