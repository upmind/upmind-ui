// -----------------------------------------------------------------------------
/**
 * @fileoverview contract — the never-authenticated guard (AC-16)
 *
 * ## Job To Be Done
 * Prove `contract.feature`'s `@AC-16 @guard @negative-control` scenario
 * ("Nothing is read or changed on my contracts without an authenticated
 * client session") under its literal precondition: a session that never
 * authenticates. Design.md §8.9 states the module's own shape for this case
 * — "The two machines stay in `subscribing`. No request (AC16)." — so
 * neither surface ever fires a request. The manager's `isReady()` genuinely
 * never settles while `subscribing` (proven below) — only a failed load
 * settles it `false`, on the top-level `error` node (D43), and a session that
 * never authenticates never loads; a forced write settles
 * promptly to `false` with no request sent, which is this module's own
 * refusal shape, never a silent success and never a hang.
 *
 * ## What Breaks If These Fail
 * An unauthenticated caller reaches a client's contract resource at all, or
 * a forced action against either surface is left to time out instead of
 * being refused.
 */

import { describe, expect, it } from "vitest";
import { useContract, useContracts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import {
  installBackgroundStubs,
  observeAllRequests
} from "./contract.int-helpers";

// -----------------------------------------------------------------------------

/** Boots the store to the guest floor — no client session is ever added. */
async function bootUnauthenticated(): Promise<void> {
  installBackgroundStubs();
  await useSessionStore().initStore();
}

/**
 * The value an action SETTLED on: its rejection, a `{ resolved }` wrapper, or
 * the `never-settled` sentinel. Raced rather than awaited outright — with the
 * guard never authenticating, an action can block on a machine that never
 * leaves `subscribing`, so a bare `rejects` assertion would report a file
 * timeout instead of naming what went wrong.
 */
async function settlement(action: Promise<unknown>): Promise<unknown> {
  return Promise.race([
    action.then(
      resolved => ({ resolved }),
      rejection => rejection
    ),
    new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
  ]);
}

const TARGET_ID = "00000000-0000-0000-0000-000000000000";

// -----------------------------------------------------------------------------

/**
 * AC-16's unauthenticated Outline, per `<use>` still on this module after R33:
 * - `@proves contract.feature:225` — I open my contracts
 * - `@proves contract.feature:226` — I open one of my contracts
 * - `@proves contract.feature:227` — I force a payment-method change
 *
 * The forced-cancellation-request row moved to
 * `contract-product.auth-guard.int.test.ts` with R33.
 */
describe("contract with no authenticated client session (AC-16)", () => {
  it("AC-16 makes no request against any contract resource — forced or not", async () => {
    await bootUnauthenticated();
    const observed = observeAllRequests();

    useContracts().as(ScopeActorTypes.CLIENT);
    useContract().as(ScopeActorTypes.CLIENT).withId(TARGET_ID);
    // Give an (incorrectly) enabled query/machine time to fire before
    // asserting absence.
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.matching("/contracts").map(request => request.url)).toEqual(
      []
    );
  });

  it("AC-16 never reports the collection ready while the session never authenticates", async () => {
    await bootUnauthenticated();

    const collection = useContracts().as(ScopeActorTypes.CLIENT);

    const settled = await Promise.race([
      collection.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });

  it("AC-16 never reports the manager ready — it stays in `subscribing`", async () => {
    await bootUnauthenticated();

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(TARGET_ID);

    const settled = await Promise.race([
      manager.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe("never-settled");
  });

  it("AC-16 refuses a forced setPaymentMethod without authenticating, sending no request", async () => {
    await bootUnauthenticated();
    const observed = observeAllRequests();

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(TARGET_ID);

    await expect(
      settlement(
        manager.useActions().setPaymentMethod({
          paymentDetailsId: "785d26e9-6783-d16e-738f-314502e70439"
        })
      ),
      "setPaymentMethod"
    ).resolves.toEqual({ resolved: false });

    observed.stop();
    expect(observed.matching("/contracts").map(request => request.url)).toEqual(
      []
    );
  });
});
