import { NextRequest } from "next/server";
import { z } from "zod";
import { taskState } from "@/server/agents/operations";
import { handleAgent } from "@/server/agents/http";
export const runtime = "nodejs";
const query = z.object({ taskId: z.string().uuid() });
export async function GET(request: NextRequest) { return handleAgent(request, (ctx) => taskState(ctx, query.parse(Object.fromEntries(request.nextUrl.searchParams)).taskId)); }
