import { withOwner } from "@/server/integrations/http";
import { pollDeviceFlow, GithubError } from "@/server/integrations/github-client";
import { connectGithub } from "@/server/integrations/github";
import { deviceStore } from "@/server/integrations/device-store";
export const runtime = "nodejs";

export async function POST() {
  return withOwner(async ({ brandId }) => {
    const clientId = process.env.GITHUB_CLIENT_ID; if (!clientId) throw new GithubError("GITHUB_CLIENT_ID is not configured on the server.", 500);
    const started = deviceStore.get(brandId);
    if (!started || started.expiresAt < Date.now()) { deviceStore.delete(brandId); return { status: "expired" }; }
    const result = await pollDeviceFlow(clientId, started.deviceCode);
    if (result.status !== "ok") { if (result.status === "expired" || result.status === "denied") deviceStore.delete(brandId); return { status: result.status }; }
    deviceStore.delete(brandId);
    const { login } = await connectGithub(brandId, result.token!);
    return { status: "connected", login };
  });
}
