import { afterEach, describe, expect, it } from "vitest";
import { playbook } from "../src/server/agents/playbooks";

const saved = process.env.MARKPATH_PUBLIC_URL;
afterEach(() => { if (saved) process.env.MARKPATH_PUBLIC_URL = saved; else delete process.env.MARKPATH_PUBLIC_URL; });

describe("public links in playbooks", () => {
  it("keeps API calls on the local address but sends people to the public one", () => {
    process.env.MARKPATH_PUBLIC_URL = "https://markpath.example.com/";
    const text = playbook("director", "mp", "http://localhost:3000");
    expect(text).toContain("https://markpath.example.com/approve/");
    expect(text).not.toContain("http://localhost:3000/approve/");
    expect(text).toContain("http://localhost:3000/api/agent/audit");
  });
  it("uses the request address when no public address is set", () => {
    delete process.env.MARKPATH_PUBLIC_URL;
    expect(playbook("director", "mp", "http://localhost:3000")).toContain("http://localhost:3000/approve/");
  });
});
