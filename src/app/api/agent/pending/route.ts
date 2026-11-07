import { NextRequest } from "next/server";
import { pendingTasks } from "@/server/agents/operations";
import { handleAgent } from "@/server/agents/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { return handleAgent(request, (ctx) => pendingTasks(ctx)); }
