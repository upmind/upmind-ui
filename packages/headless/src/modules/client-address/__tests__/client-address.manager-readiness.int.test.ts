// -----------------------------------------------------------------------------
/**
 * @fileoverview client address manager — the wait for the form always ends
 * (integration, AC-26)
 *
 * ## Job To Be Done
 * Prove the editor's readiness wait is BOUNDED against a lookup chain that
 * never returns: it settles within a known limit, and it surfaces the stall as
 * a CATCHABLE rejection carrying a timeout status rather than resolving as if
 * the form were usable (D-10, parity rows L6/M18 — the `timeout: Infinity`
 * wait this story replaces).
 *
 * ## Why this is its OWN file
 * `useBrand` and `useSystem` are module-level singletons whose queries stay
 * warm for the lifetime of a vitest FILE. A stall installed after any earlier
 * test in the same file is never reached — the readiness wait returns off a
 * cache hit and the assertion passes without ever exercising the bound. This
 * file therefore holds nothing else, so the very first lookup of the process
 * is the stalled one.
 *
 * ## What Breaks If These Fail
 * A form hangs forever on a lookup that never returns, with no error a
 * consumer can catch and nothing on screen to explain it (hazard Z2).
 */

import { http } from "msw";
import { describe, expect, it } from "vitest";
import { ClientAddressContextTypes, useClientAddressManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressHandler,
  recorded,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The ceiling AC-26's "within a known limit" is read back against. */
const READINESS_BOUND_MS = 20000;

/** Opens an editor whose country/region lookups never answer. */
async function openEditorWithStalledLookups() {
  const { clientId } = await seedClientSession();
  const row = recorded.one().data;
  installAddressHandler(server, clientId, row);
  server?.use(
    http.get("*/countries", () => new Promise<never>(() => {})),
    http.get(
      "*/countries/:countryId/regions",
      () => new Promise<never>(() => {})
    ),
    http.get("*/config/brand/values", () => new Promise<never>(() => {}))
  );

  return useClientAddressManager()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientAddressContextTypes.ADDRESS, row.id);
}

// -----------------------------------------------------------------------------

describe("client address manager — every wait for the form ends (AC-26)", () => {
  it("AC-26 settles isReady() within a known limit when the lookup chain never returns", async () => {
    const manager = await openEditorWithStalledLookups();

    const started = Date.now();
    const outcome = await Promise.race([
      manager
        .useActions()
        .isReady()
        .then(
          value => ({ kind: "resolved" as const, value }),
          error => ({ kind: "rejected" as const, value: error })
        ),
      new Promise<{ kind: "hung" }>(resolve =>
        setTimeout(() => resolve({ kind: "hung" }), READINESS_BOUND_MS)
      )
    ]);

    expect(outcome.kind).not.toBe("hung");
    expect(Date.now() - started).toBeLessThan(READINESS_BOUND_MS);
  }, 30000);

  it("AC-26 surfaces the stall as a CATCHABLE rejection carrying a timeout status", async () => {
    const manager = await openEditorWithStalledLookups();

    const caught = await Promise.race([
      manager
        .useActions()
        .isReady()
        .then(
          () => undefined,
          error => error as { status?: unknown; message?: string }
        ),
      new Promise<undefined>(resolve =>
        setTimeout(() => resolve(undefined), READINESS_BOUND_MS)
      )
    ]);

    expect(caught).toBeDefined();
    expect(String(caught?.status ?? caught?.message ?? "")).toMatch(/timeout/i);
  }, 30000);
});
