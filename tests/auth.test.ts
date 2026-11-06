import { describe, expect, it } from "vitest";
import { createSessionValue, readSessionValue } from "../src/server/auth/session";

describe("session signing", () => {
  it("accepts a signed user session and rejects tampering", () => {
    const value = createSessionValue("user-123");
    expect(readSessionValue(value)).toBe("user-123");
    expect(readSessionValue(`${value}x`)).toBeNull();
  });
});
