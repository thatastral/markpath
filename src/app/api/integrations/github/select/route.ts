import { NextRequest } from "next/server";
import { z } from "zod";
import { withOwner } from "@/server/integrations/http";
import { selectGithubRepo } from "@/server/integrations/github";
export const runtime = "nodejs";
const body = z.object({ repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "Pick a repository like owner/name.") });
export async function POST(request: NextRequest) { const input = body.safeParse(await request.json().catch(() => ({}))); return withOwner(async ({ brandId }) => { if (!input.success) throw input.error; return selectGithubRepo(brandId, input.data.repo); }); }
