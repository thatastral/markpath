import { NextRequest } from "next/server";
import { z } from "zod";
import { waitForApprovals } from "@/server/agents/operations";
import { handleAgent } from "@/server/agents/http";
export const runtime = "nodejs";
export const maxDuration = 100;
const query = z.object({ taskId: z.string().uuid(), timeoutSeconds: z.coerce.number().int().min(1).max(90).default(60) });
export async function GET(request: NextRequest) { return handleAgent(request, (ctx) => { const q = query.parse(Object.fromEntries(request.nextUrl.searchParams)); return waitForApprovals(ctx, q.taskId, q.timeoutSeconds); }); }
