import { NextRequest } from "next/server";
import { recordPluginFindings } from "@/server/plugin/operations";
import { body, handlePlugin, preflight } from "@/server/plugin/http";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function POST(request: NextRequest) { return handlePlugin(request, async (brandId) => recordPluginFindings(brandId, await body(request))); }
