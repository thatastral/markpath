import { describe, expect, it } from "vitest";
import { FakeSwitchClient } from "../src/server/switch/client";
import { hasValidAgentToken } from "../src/server/agents/auth";

describe("Switch boundary", () => {
  it("uses a testable Switch health adapter", async () => { expect(await new FakeSwitchClient({ connected: true, detail: "fixture" }).health()).toEqual({ connected: true, detail: "fixture" }); });
  it("does not authorize an agent API request when no secret is configured", () => { const prior = process.env.MARKPATH_AGENT_TOKEN; delete process.env.MARKPATH_AGENT_TOKEN; expect(hasValidAgentToken("Bearer anything")).toBe(false); if (prior) process.env.MARKPATH_AGENT_TOKEN = prior; });
});
