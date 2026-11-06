// In-memory, per server process: a device code is short-lived and only useful to the signed-in owner who started the flow.
export type PendingDevice = { deviceCode: string; expiresAt: number; userCode: string; verificationUri: string; interval: number };
const g = globalThis as unknown as { __mpDevice?: Map<string, PendingDevice> };
g.__mpDevice ??= new Map();
export const deviceStore = g.__mpDevice;
