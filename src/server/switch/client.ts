export type SwitchHealth = { connected: boolean; detail: string };
export interface SwitchClient { health(): Promise<SwitchHealth>; }

export class HttpSwitchClient implements SwitchClient {
  constructor(private readonly baseUrl = process.env.SWITCH_BASE_URL) {}
  async health(): Promise<SwitchHealth> {
    if (!this.baseUrl) return { connected: false, detail: "Switch base URL is not configured." };
    try { const response = await fetch(new URL("/health", this.baseUrl), { cache: "no-store", signal: AbortSignal.timeout(5_000) }); return { connected: response.ok, detail: response.ok ? "Switch health endpoint responded." : `Switch health returned ${response.status}.` }; }
    catch { return { connected: false, detail: "Switch health endpoint could not be reached." }; }
  }
}

export class FakeSwitchClient implements SwitchClient { constructor(private readonly result: SwitchHealth) {} async health() { return this.result; } }
