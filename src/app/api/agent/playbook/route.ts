import { NextRequest } from "next/server";
import { z } from "zod";
import { rolePlaybook } from "@/server/agents/operations";
import { handleAgent } from "@/server/agents/http";
export const runtime = "nodejs";
const query = z.object({ team: z.string().min(1).max(40).default("markpath") });
export async function GET(request: NextRequest) { return handleAgent(request, (ctx) => rolePlaybook(ctx, query.parse(Object.fromEntries(request.nextUrl.searchParams)).team, request.nextUrl.origin)); }
