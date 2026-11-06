import { withOwner } from "@/server/integrations/http";
import { disconnectGithub } from "@/server/integrations/github";
export const runtime = "nodejs";
export async function POST() { return withOwner(async ({ brandId }) => { disconnectGithub(brandId); return { status: "not_connected" }; }); }
