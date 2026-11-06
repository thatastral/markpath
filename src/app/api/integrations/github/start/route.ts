import { withOwner } from "@/server/integrations/http";
import { startDeviceFlow, GithubError } from "@/server/integrations/github-client";
import { deviceStore } from "@/server/integrations/device-store";
export const runtime = "nodejs";

export async function POST() {
  return withOwner(async ({ brandId }) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) throw new GithubError("GITHUB_CLIENT_ID is not configured on the server.", 500);
    const flow = await startDeviceFlow(clientId);
    deviceStore.set(brandId, { deviceCode: flow.device_code, expiresAt: Date.now() + flow.expires_in * 1000, userCode: flow.user_code, verificationUri: flow.verification_uri, interval: flow.interval });
    return { userCode: flow.user_code, verificationUri: flow.verification_uri, interval: flow.interval, expiresIn: flow.expires_in };
  });
}

// Lets the page resume a sign-in that is still waiting (for example after a reload).
export async function GET() {
  return withOwner(async ({ brandId }) => {
    const p = deviceStore.get(brandId);
    if (!p || p.expiresAt < Date.now()) { deviceStore.delete(brandId); return { pending: null }; }
    return { pending: { userCode: p.userCode, verificationUri: p.verificationUri, interval: p.interval } };
  });
}
