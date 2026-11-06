import { NextRequest } from "next/server";
import { z } from "zod";
import { recordRoomEvent } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ roomId: z.string().min(1).max(200), messageId: z.string().min(1).max(200), taskId: z.string().uuid().optional(), note: z.string().max(200).optional() });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => recordRoomEvent(ctx, body.parse(await jsonBody(request)))); }
