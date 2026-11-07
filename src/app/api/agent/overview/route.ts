import { NextRequest } from "next/server";
import { overview } from "@/server/agents/operations";
import { handleAgent } from "@/server/agents/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { return handleAgent(request, (ctx) => overview(ctx)); }
