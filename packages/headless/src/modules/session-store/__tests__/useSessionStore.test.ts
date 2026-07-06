/**
 * @fileoverview Session-store token derivations (unit)
 *
 * ## Job To Be Done
 * Prove expiry is derived purely from the token's own timestamps
 * (created_at + expires_in) and that the persistence surface rejects a
 * secretless token — no store boot, no network.
 *
 * ## What Breaks If These Fail
 * A mint that drops created_at reads as an instantly-dead session (users
 * bounced to login on every reload); a malformed token is silently persisted
 * as the cookie-of-record.
 */

import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { persistTokenToStorage } from "..";
import { useSessionStore } from "../useSessionStore";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

describe("useSessionStore token derivations", () => {
  it("derives the expiry timestamp as created_at + expires_in seconds", () => {
    // SS-U1 — ss-gotchas §9 🧪; ss-usage §useActions (`getExpiresAt`)
    const { getExpiresAt } = useSessionStore().useActions();
    const base = getFixtureBody<IToken>("post-oauth-access-token-guest", {
      recordingsDir
    });
    const now = Date.now();
    const token: IToken = { ...base, created_at: now };

    expect(getExpiresAt(token)).toBe(now + base.expires_in * 1000);
  });

  it("treats a token without created_at as already expired", () => {
    // SS-U2 — ss-gotchas §9 ("no created_at → treated as expired");
    // ss-foundation §Lessons (last bullet)
    const { getExpiresAt } = useSessionStore().useActions();
    const token = getFixtureBody<IToken>("post-oauth-access-token-guest", {
      recordingsDir
    });

    expect(token.created_at).toBeUndefined();
    expect(getExpiresAt(token)).toBeNull();
  });

  it("rejects a token missing access_token and writes no session cookie", async () => {
    // SS-U3 — ss-usage §Persistence 🧪 ("with a token missing `access_token`
    // throws")
    const base = getFixtureBody<IToken>("post-oauth-access-token-guest", {
      recordingsDir
    });
    const invalid = { ...base, access_token: undefined } as unknown as IToken;

    // Wrapped in an async closure: the surface is documented as returning
    // `Promise<IToken>`, but a validation guard may throw synchronously
    // before a promise is returned — this catches either shape (SS-U3).
    await expect(async () =>
      persistTokenToStorage(invalid)
    ).rejects.toBeDefined();
    expect(document.cookie).not.toMatch(/upm_(guest|client|user)_session=/);
  });
});
