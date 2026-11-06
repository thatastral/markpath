import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent, type AgentPrincipal } from "./auth";
import { AgentApiError } from "./operations";

export async function handleAgent(request: NextRequest, run: (ctx: AgentPrincipal) => Promise<unknown> | unknown) {
  const ctx = authenticateAgent(request.headers.get("authorization"));
  if (!ctx) return NextResponse.json({ error: "Agent API is not configured or the token is invalid." }, { status: 401 });
  try { return NextResponse.json(await run(ctx)); }
  catch (error) {
    if (error instanceof AgentApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
}
export async function jsonBody(request: NextRequest) { try { return await request.json(); } catch { return {}; } }
