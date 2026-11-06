import { withOwner } from "@/server/integrations/http";
import { listGithubRepos } from "@/server/integrations/github";
export const runtime = "nodejs";
export async function GET() { return withOwner(async ({ brandId }) => ({ repos: await listGithubRepos(brandId) })); }
