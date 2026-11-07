import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDatabase, getDatabase } from "../src/server/db/client";
import { seedDatabase } from "../src/server/db/seed";
import { requestPasswordReset, resetPassword, resetTokenValid, sessionStillValid } from "../src/server/auth/reset";
import { authenticate } from "../src/server/auth/service";

const saved = process.env.MARKPATH_DB_PATH; const dirs: string[] = [];
afterEach(() => { if (saved) process.env.MARKPATH_DB_PATH = saved; else delete process.env.MARKPATH_DB_PATH; dirs.splice(0).forEach((d) => { closeDatabase(join(d, "db.sqlite")); rmSync(d, { recursive: true, force: true }); }); vi.restoreAllMocks(); });

describe("password reset", () => {
  it("emails a single-use link, sets the new password and signs out older sessions", async () => {
    const dir = mkdtempSync(join(tmpdir(), "markpath-reset-")); dirs.push(dir); process.env.MARKPATH_DB_PATH = join(dir, "db.sqlite");
    const { user } = await seedDatabase(process.env.MARKPATH_DB_PATH);
    const logged: string[] = []; vi.spyOn(console, "info").mockImplementation((m: string) => { logged.push(m); });
    expect(await requestPasswordReset("nobody@example.com", "http://localhost:3000")).toEqual({ ok: true }); // same answer for unknown emails
    expect(logged).toHaveLength(0);
    await requestPasswordReset("demo@markpath.local", "http://localhost:3000");
    const token = decodeURIComponent(/token=([^\s]+)/.exec(logged[0])![1]);
    expect(resetTokenValid(token)).toBe(true);
    const before = Date.now() - 5000;
    expect((await resetPassword(token, "short")).ok).toBe(false);
    expect(await resetPassword(token, "a-new-password-123")).toMatchObject({ ok: true, userId: user.id });
    expect(resetTokenValid(token)).toBe(false); // used up
    expect((await resetPassword(token, "another-password-1")).ok).toBe(false);
    expect((await authenticate({ email: "demo@markpath.local", password: "a-new-password-123" })).ok).toBe(true);
    expect(sessionStillValid(user.id, before)).toBe(false);
    expect(sessionStillValid(user.id, Date.now())).toBe(true);
    getDatabase(process.env.MARKPATH_DB_PATH);
  });
});
