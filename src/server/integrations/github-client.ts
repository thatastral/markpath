// Minimal GitHub REST client. `fetchImpl` is injectable so tests never touch the network.
export type Fetch = typeof fetch;
export class GithubError extends Error { constructor(message: string, readonly status: number) { super(message); } }

export class GithubClient {
  constructor(private readonly token: string, private readonly fetchImpl: Fetch = fetch) {}
  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.fetchImpl(`https://api.github.com${path}`, { method, headers: { Authorization: `Bearer ${this.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) { const text = await response.text().catch(() => ""); throw new GithubError(`GitHub ${method} ${path} failed (${response.status}). ${text.slice(0, 200)}`, response.status); }
    return (response.status === 204 ? undefined : await response.json()) as T;
  }
  user() { return this.call<{ login: string }>("GET", "/user"); }
  listRepos() { return this.call<Array<{ full_name: string; private: boolean; default_branch: string; permissions?: { push?: boolean } }>>("GET", "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator"); }
  repo(full: string) { return this.call<{ full_name: string; default_branch: string; permissions?: { push?: boolean } }>("GET", `/repos/${full}`); }
  tree(full: string, branch: string) { return this.call<{ tree: Array<{ path: string; type: string; size?: number }>; truncated: boolean }>("GET", `/repos/${full}/git/trees/${encodeURIComponent(branch)}?recursive=1`); }
  async file(full: string, path: string, ref: string) { const f = await this.call<{ content: string; sha: string }>("GET", `/repos/${full}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`); return { sha: f.sha, text: Buffer.from(f.content, "base64").toString("utf8") }; }
  async branchSha(full: string, branch: string) { return (await this.call<{ object: { sha: string } }>("GET", `/repos/${full}/git/ref/heads/${encodeURIComponent(branch)}`)).object.sha; }
  createBranch(full: string, name: string, sha: string) { return this.call<unknown>("POST", `/repos/${full}/git/refs`, { ref: `refs/heads/${name}`, sha }); }
  putFile(full: string, path: string, input: { message: string; text: string; branch: string; sha?: string }) { return this.call<{ commit: { sha: string } }>("PUT", `/repos/${full}/contents/${path.split("/").map(encodeURIComponent).join("/")}`, { message: input.message, content: Buffer.from(input.text, "utf8").toString("base64"), branch: input.branch, ...(input.sha ? { sha: input.sha } : {}) }); }
  createPull(full: string, input: { title: string; head: string; base: string; body: string }) { return this.call<{ number: number; html_url: string }>("POST", `/repos/${full}/pulls`, input); }
  pull(full: string, number: number) { return this.call<{ state: string; merged: boolean; title: string; user?: { login: string }; head: { ref: string; sha: string }; base: { ref: string } }>("GET", `/repos/${full}/pulls/${number}`); }
  listOpenPulls(full: string) { return this.call<Array<{ number: number; title: string; user?: { login: string }; head: { ref: string; sha: string }; base: { ref: string } }>>("GET", `/repos/${full}/pulls?state=open&per_page=30`); }
  comment(full: string, number: number, body: string) { return this.call<{ id: number }>("POST", `/repos/${full}/issues/${number}/comments`, { body }); }
  pullFiles(full: string, number: number) { return this.call<Array<{ filename: string; patch?: string }>>("GET", `/repos/${full}/pulls/${number}/files?per_page=100`); }
  createRepo(name: string, description: string) { return this.call<{ full_name: string; default_branch: string }>("POST", "/user/repos", { name, description, private: true, auto_init: true }); }
}

export type DeviceCode = { device_code: string; user_code: string; verification_uri: string; expires_in: number; interval: number };
export async function startDeviceFlow(clientId: string, fetchImpl: Fetch = fetch): Promise<DeviceCode> {
  const response = await fetchImpl("https://github.com/login/device/code", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId, scope: "repo" }), signal: AbortSignal.timeout(20_000) });
  const data = await response.json() as Partial<DeviceCode> & { error?: string; error_description?: string };
  if (!response.ok || !data.device_code) throw new GithubError(data.error_description ?? data.error ?? "GitHub did not start the sign-in. Check that Device Flow is enabled on the OAuth app.", response.status);
  return data as DeviceCode;
}
export async function pollDeviceFlow(clientId: string, deviceCode: string, fetchImpl: Fetch = fetch): Promise<{ status: "pending" | "slow_down" | "expired" | "denied" | "ok"; token?: string }> {
  const response = await fetchImpl("https://github.com/login/oauth/access_token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId, device_code: deviceCode, grant_type: "urn:ietf:params:oauth:grant-type:device_code" }), signal: AbortSignal.timeout(20_000) });
  const data = await response.json() as { access_token?: string; error?: string };
  if (data.access_token) return { status: "ok", token: data.access_token };
  if (data.error === "authorization_pending") return { status: "pending" };
  if (data.error === "slow_down") return { status: "slow_down" };
  if (data.error === "expired_token") return { status: "expired" };
  if (data.error === "access_denied") return { status: "denied" };
  throw new GithubError(`GitHub sign-in failed: ${data.error ?? "unknown error"}.`, 400);
}
