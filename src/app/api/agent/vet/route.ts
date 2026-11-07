import { NextRequest } from "next/server";
import { z } from "zod";
import { vetLink } from "@/server/agents/operations";
import { handleAgent, jsonBody } from "@/server/agents/http";
export const runtime = "nodejs";
const body = z.object({ url: z.string().url().max(500) });
export async function POST(request: NextRequest) { return handleAgent(request, async (ctx) => vetLink(ctx, body.parse(await jsonBody(request)))); }
