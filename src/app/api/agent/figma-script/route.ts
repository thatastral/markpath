import { NextRequest } from "next/server";
import { z } from "zod";
import { figmaScript } from "@/server/agents/operations";
import { handleAgent } from "@/server/agents/http";
export const runtime = "nodejs";
const query = z.object({ name: z.enum(["inspect", "apply"]) });
export async function GET(request: NextRequest) { return handleAgent(request, (ctx) => figmaScript(ctx, query.parse(Object.fromEntries(request.nextUrl.searchParams)).name)); }
