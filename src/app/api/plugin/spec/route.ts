import { NextRequest } from "next/server";
import { pluginSpec } from "@/server/plugin/operations";
import { handlePlugin, preflight } from "@/server/plugin/http";
export const runtime = "nodejs";
export const OPTIONS = preflight;
export async function GET(request: NextRequest) { return handlePlugin(request, (brandId) => pluginSpec(brandId)); }
