// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC-2 — runtime reflection of a live scope-based composable.
 *
 * ## Job To Be Done
 * Prove the core's reflected surface is EXACTLY live `useAuth`'s surface —
 * per-actor action sets, all context keys (incl. schema/uischema), all meta
 * flags as plain booleans — through the journeys-lane test-side adapter
 * (`./adapter`), never the package itself: `packages/scenario-harness/**`
 * has a lint boundary banning headless imports, tests included, so the live
 * boot has to happen out here.
 *
 * Every boot below chains `.fresh()`: the machine's `isNewSession` guard is
 * synchronous (`auth.machine.ts` `checking.always`), so no MSW/session-store
 * setup is needed and no test can leak state into another via the shared
 * scope registry (`scope.utils.ts generateScopeKey` — `fresh:` is unique per
 * call).
 *
 * ## What Breaks If These Fail
 * The playground would validate against a stale or partial mirror of a real
 * module — silently hiding actions, context keys or meta flags that a
 * developer's business logic actually exposes.
 *
 * ## FE-3051 — blocked, not executed, in this MR
 * Runtime execution of this file is blocked by FE-3051 (pre-existing,
 * unrelated): `packages/headless/src/modules/payment-gateways/razorpay/
 * schemas.ts` imports three non-existent relative modules
 * (`../schemas`/`../utils`/`../types`), and any import of
 * `@upmind-automation/headless`'s single barrel — including this file's —
 * transitively pulls that module in, so `vitest run` fails to even collect.
 * Reproduces identically on the pre-existing
 * `storefront-guest-oneoff-checkout-stripe.int.test.ts` journey, confirming
 * it is not introduced by FE-2976. This file is typecheck-clean against the
 * live graph (`pnpm run typecheck:journeys` reports zero errors here) but
 * UNEXECUTED as of this MR — do not read a green CI run of this suite until
 * FE-3051 lands.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useAuth
} from "@upmind-automation/headless";
import { reflect, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { bootAuthPort, wrapWithEnumerationSpy } from "./adapter";
import { COMPOSABLE_KEY } from "./manifest";

const SHARED_LIFECYCLE_ACTIONS = [
  "destroy",
  "onDone",
  "onError",
  "reject",
  "resolve",
  "set"
];

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

describe("@AC-2 reflection.int — live useAuth reflected through the port", () => {
  it("the reflected surface is exactly the live surface — client", () => {
    const { port, destroy } = bootAuthPort(ScopeActorTypes.CLIENT);
    cleanups.push(destroy);

    const descriptor = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);

    // Canary counts (useAuth.meta.ts:18-152, useAuth.context.ts:35-37).
    expect(Object.keys(descriptor.snapshot.meta)).toHaveLength(20);
    expect(Object.keys(descriptor.snapshot.context)).toHaveLength(12);
    expect(descriptor.snapshot.context).toHaveProperty("schema");
    expect(descriptor.snapshot.context).toHaveProperty("uischema");
  });

  it("action sets differ per actor and both are reported truthfully, sharing the lifecycle arm", () => {
    const client = bootAuthPort(ScopeActorTypes.CLIENT);
    const staff = bootAuthPort(ScopeActorTypes.STAFF);
    cleanups.push(client.destroy, staff.destroy);

    const clientDescriptor = reflect(
      COMPOSABLE_KEY.AUTH,
      SCOPE_ACTOR.CLIENT,
      client.port
    );
    const staffDescriptor = reflect(
      COMPOSABLE_KEY.AUTH,
      SCOPE_ACTOR.STAFF,
      staff.port
    );

    expect(clientDescriptor.snapshot.actions).toContain("registerAsGuest");
    expect(staffDescriptor.snapshot.actions).not.toContain("registerAsGuest");

    for (const member of SHARED_LIFECYCLE_ACTIONS) {
      expect(clientDescriptor.snapshot.actions).toContain(member);
      expect(staffDescriptor.snapshot.actions).toContain(member);
    }
  });

  it("meta crosses the port as already-evaluated booleans — no reactive wrapper", () => {
    const { port, destroy } = bootAuthPort(ScopeActorTypes.CLIENT);
    cleanups.push(destroy);

    const descriptor = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);

    expect(Object.values(descriptor.snapshot.meta).length).toBeGreaterThan(0);
    for (const value of Object.values(descriptor.snapshot.meta)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("a fresh snapshot after a schema re-assignment carries the newly assigned schema", async () => {
    const { port, actions, destroy } = bootAuthPort(ScopeActorTypes.CLIENT);
    cleanups.push(destroy);

    const before = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);
    expect(before.snapshot.context.schema).toBeUndefined();

    const start = actions.start as (flow?: AuthFlowTypes) => Promise<boolean>;
    await start(AuthFlowTypes.LOGIN);

    const after = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);
    expect(after.snapshot.context.schema).toBeDefined();
    expect(after.snapshot.context.schema).not.toBe(
      before.snapshot.context.schema
    );
  });

  it("exactly one deliberate boot — no builder enumeration (scope.builder.ts:266-328's ownKeys trap side-effectfully instantiates on enumeration)", () => {
    const { proxy, spy } = wrapWithEnumerationSpy(useAuth());

    const auth = proxy.as(ScopeActorTypes.CLIENT).fresh();
    const bootActions = auth.useActions();
    void auth.useContext();
    void auth.useMeta();
    cleanups.push(() => bootActions.destroy());

    expect(spy.ownKeysCalls).toBe(0);
    expect(spy.getOwnPropertyDescriptorCalls).toBe(0);
    expect(spy.hasCalls).toBe(0);
  });
});
