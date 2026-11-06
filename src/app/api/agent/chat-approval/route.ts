import { NextRequest } from "next/server";
import { z } from "zod";
import { chatApproval } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ taskId: z.string().uuid(), senderHandle: z.string().min(1).max(100), roomId: z.string().min(1).max(200), messageId: z.string().min(1).max(200), quote: z.string().min(1).max(500) });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => chatApproval(ctx, body.parse(await jsonBody(request)))); }
