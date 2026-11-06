import { NextRequest, NextResponse } from "next/server";
import { PluginApiError, pluginPrincipal } from "./operations";

// The plugin UI runs in a Figma iframe with an opaque origin, so CORS is open. Auth is a bearer token, never a cookie.
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
export function preflight() { return new NextResponse(null, { status: 204, headers: cors }); }
export async function handlePlugin(request: NextRequest, run: (brandId: string) => Promise<unknown> | unknown) {
  const principal = pluginPrincipal(request.headers.get("authorization"));
  if (!principal) return NextResponse.json({ error: "Plugin API is not configured or the token is invalid." }, { status: 401, headers: cors });
  try { return NextResponse.json(await run(principal.brandId), { headers: cors }); }
  catch (error) {
    if (error instanceof PluginApiError) return NextResponse.json({ error: error.message }, { status: error.status, headers: cors });
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: cors });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500, headers: cors });
  }
}
export async function body(request: NextRequest) { try { return await request.json(); } catch { return {}; } }
