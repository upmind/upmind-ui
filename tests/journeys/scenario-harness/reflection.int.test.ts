// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC-2 — runtime reflection of a live scope-based composable.
 *
 * ## Job To Be Done
 * Prove the core's reflected surface is EXACTLY live `useAuth`'s surface —
 * per-actor action sets, all context keys (incl. schema/uischema), all meta
 * flags as plain booleans — through the journeys-lane test-side adapter
 * (`./adapter`), never the package itself (design §9 bans headless imports
 * under `packages/scenario-harness/**`, tests included — bdd.md §Placement).
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
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useAuth
} from "@upmind-automation/headless";
import {
  COMPOSABLE_KEY,
  reflect,
  SCOPE_ACTOR
} from "@upmind-automation/scenario-harness";
import { bootAuthPort, wrapWithEnumerationSpy } from "./adapter";

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

  it("exactly one deliberate boot — no builder enumeration (risk §11.1, scope.builder.ts:266-328)", () => {
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
