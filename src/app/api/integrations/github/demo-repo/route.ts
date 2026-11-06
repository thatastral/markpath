import { withOwner } from "@/server/integrations/http";
import { createDemoRepo } from "@/server/integrations/github";
export const runtime = "nodejs";
export async function POST() { return withOwner(async ({ brandId }) => createDemoRepo(brandId)); }
