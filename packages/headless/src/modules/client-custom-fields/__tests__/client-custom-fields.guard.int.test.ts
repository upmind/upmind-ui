// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — the never-authenticated guard (AC-25)
 *
 * ## Job To Be Done
 * Prove AC-25 under its literal precondition: a session that NEVER
 * authenticates. No test here seeds a client session, and vitest isolates
 * each test file, so the store only ever reaches the guest floor. Under that
 * condition: zero requests against any client's custom fields, `refresh()`
 * rejected as not-authenticated rather than sent anyway, and
 * `meta.isAvailable` flipping together with the request gate in the same
 * tick.
 *
 * The auth-guard `*.must-fail.patch` removes this guard from
 * `resolveClientId` / `isAddressable`; the "no request" / "rejects"
 * assertions here are what must then fire.
 *
 * ## What Breaks If These Fail
 * An unauthenticated caller reaches a client's custom field values at all —
 * the one thing legacy's client-area guard never allowed.
 */

import { describe, expect, it } from "vitest";
// Import order is load-bearing — see the same note in
// `client-custom-fields.collection.int.test.ts`. `session-store` (real,
// unmocked) must load before this module's own barrel ("..") touches
// `../scope` fresh, so it stays ahead here despite `import/order`'s
// parent-before-sibling default.
import { useClientCustomFields } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import {
  installBackgroundStubs,
  observeRequests
} from "./client-custom-fields.int-helpers";
import { NotAuthenticatedError } from "../../../utils";

// -----------------------------------------------------------------------------

async function bootUnauthenticated(): Promise<void> {
  installBackgroundStubs();
  await useSessionStore().initStore();
}

// -----------------------------------------------------------------------------

describe("client-custom-fields with no authenticated client session (AC-25)", () => {
  it("AC-25 makes no request against any client's custom field values", async () => {
    await bootUnauthenticated();
    const observed = observeRequests("/custom_fields");

    useClientCustomFields().as(ScopeActorTypes.SELF);
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
  });

  it("AC-25 rejects a forced refresh as not-authenticated, not as a 401 response", async () => {
    await bootUnauthenticated();
    const observed = observeRequests("/custom_fields");

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    await expect(fields.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
    observed.stop();
    expect(observed.all()).toEqual([]);
  });

  it("AC-25 meta.isAvailable and the request gate flip together — both false, in the same tick", async () => {
    await bootUnauthenticated();

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    expect(fields.useMeta().isAvailable.value).toBe(false);

    await new Promise(resolve => setTimeout(resolve, 400));

    expect(fields.useMeta().isAvailable.value).toBe(false);
  });

  it("AC-6b settles false, never hanging, when the session never authenticates", async () => {
    await bootUnauthenticated();
    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    const settled = await Promise.race([
      fields.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });
});
