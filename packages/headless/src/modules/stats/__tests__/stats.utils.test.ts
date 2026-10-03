// -----------------------------------------------------------------------------
/**
 * @fileoverview stats — the Upmind-context gate (`isUpmindContext`)
 *
 * ## Job To Be Done
 * `isUpmindContext` decides whether the usage read may reach the wire at all:
 * the usage block is offered only on a host in the `VITE_APP_UPMIND_HOSTNAMES`
 * allowlist (vue-app `src/store/index.ts`). This pins the pure decision — host in
 * the allowlist, host not in it, and no window — with no network and no composable
 * boot, so the gate's branches cannot drift unnoticed. The usage read's REFUSAL
 * behaviour behind this gate is driven by `stats.replay.int.test.ts` (AC-13/14);
 * this test owns the gate itself.
 *
 * ## What Breaks If These Fail
 * Either every non-Upmind client's dashboard fires a usage request that can only
 * be refused (gate stuck open), or no Upmind client is ever offered the usage
 * block (gate stuck shut).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { isUpmindContext } from "../stats.utils";

// -----------------------------------------------------------------------------

describe("isUpmindContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is true when the current host is in the allowlist", () => {
    // jsdom serves `localhost`; naming it in the allowlist puts the lane in context.
    vi.stubEnv("VITE_APP_UPMIND_HOSTNAMES", "localhost");
    expect(isUpmindContext()).toBe(true);
  });

  it("is false when the current host is not in the allowlist", () => {
    vi.stubEnv("VITE_APP_UPMIND_HOSTNAMES", "my.upmind.com,app.upmind.com");
    expect(isUpmindContext()).toBe(false);
  });

  it("is false when there is no window", () => {
    vi.stubEnv("VITE_APP_UPMIND_HOSTNAMES", "localhost");
    vi.stubGlobal("window", undefined);
    expect(isUpmindContext()).toBe(false);
  });
});
