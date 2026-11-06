import { NextRequest } from "next/server";
import { withOwner } from "@/server/integrations/http";
import { getOrIssueTokens, issueTokens } from "@/server/tokens/service";
export const runtime = "nodejs";
// Owner-only. Returns this workspace's Figma plugin key (the same one each time) or rotates it on request.
export async function POST(request: NextRequest) {
  const rotate = ((await request.json().catch(() => ({}))) as { rotate?: boolean }).rotate === true;
  return withOwner(async ({ brandId }) => ({ key: rotate ? issueTokens(brandId, ["plugin"]).plugin : getOrIssueTokens(brandId, ["plugin"]).tokens.plugin, rotated: rotate }));
}
