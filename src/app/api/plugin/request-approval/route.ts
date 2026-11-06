import { NextRequest } from "next/server";
import { requestPluginApproval } from "@/server/plugin/operations";
import { body, handlePlugin, preflight } from "@/server/plugin/http";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function POST(request: NextRequest) { return handlePlugin(request, async (brandId) => requestPluginApproval(brandId, await body(request))); }
