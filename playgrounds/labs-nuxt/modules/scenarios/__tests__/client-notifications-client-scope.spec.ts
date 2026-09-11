/**
 * @module scenarios/__tests__/client-notifications-client-scope
 * @description The `client x self` cell the module ships and the page reaches.
 * Both matrices are all-`never` by ruling A — every endpoint is
 * session-implicit, so no context exists to name — and `useModulePort` reads
 * a `never` cell as "not offered".
 *
 * Identity comes from the SESSION STORE, never the url: `switchScope` sets
 * the actor scope, activates the matching session, and pushes the url in one
 * step, so the active session always IS the actor the url names. The module is
 * client-only: a signed-in client, or an unauthenticated client following the
 * emailed link with a `?token=`. Staff is denied and there is no guest.
 *
 * ## What Breaks If These Fail
 * Either the client cell is unreachable from the page again, or an actor the
 * declaration never offered becomes reachable — and for a module whose matrix
 * marks other actors `never` because they genuinely may not act, the refusal
 * is the whole protection.
 */

// --- external
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";

// --- internal
import { useModulePort } from "../runtime/composables/useModulePort";
import declaration from "../useClientNotifications/client-notifications.scenario";

// -----------------------------------------------------------------------------

/**
 * A stand-in for the real module: an all-`never` matrix, exactly as ruling A
 * leaves both of client-notifications' own, plus the four-layer surface the
 * port probes.
 */
function fakeComposable() {
  const seen: { actor?: unknown } = {};
  const cell = {
    useActions: () => ({ isReady: () => Promise.resolve(true) }),
    useContext: () => ({}),
    useInternals: () => ({}),
    useMeta: () => ({})
  };
  const builder = Object.assign(
    () => ({
      as: (actor: unknown) => {
        seen.actor = actor;
        return cell;
      }
    }),
    {
      scopeMatrix: {
        [ScopeActorTypes.SELF]: null as never,
        [ScopeActorTypes.CLIENT]: null as never,
        [ScopeActorTypes.GUEST]: null as never,
        [ScopeActorTypes.STAFF]: null as never
      }
    }
  );
  return { builder, seen };
}

describe("AC-8 — the page offers client, and the declaration is what says so", () => {
  it("declares client, so the port may serve it against a `never` cell", () => {
    expect(declaration.actors).toEqual([ScopeActorTypes.CLIENT]);
  });

  it("SERVES client, and hands that actor to the builder — no token anywhere", () => {
    const { builder, seen } = fakeComposable();
    const port = useModulePort(builder as never, {
      actor: ScopeActorTypes.CLIENT,
      offeredActors: [ScopeActorTypes.CLIENT]
    });

    expect(
      Object.keys(port.actions).length,
      "client is still refused — the cell is unreachable from the page"
    ).toBeGreaterThan(0);
    expect(seen.actor, "the builder was not scoped to client").toBe(
      ScopeActorTypes.CLIENT
    );
  });

  it("REFUSES an actor the declaration did not offer", () => {
    const { builder } = fakeComposable();
    const port = useModulePort(builder as never, {
      actor: ScopeActorTypes.STAFF,
      offeredActors: [ScopeActorTypes.CLIENT]
    });

    expect(
      port.snapshot().actions,
      "an actor the declaration never offered became reachable"
    ).toEqual([]);
  });

  it("REFUSES every actor when a declaration offers none at all", () => {
    const { builder } = fakeComposable();
    const port = useModulePort(builder as never, {
      actor: ScopeActorTypes.CLIENT
    });

    expect(
      port.snapshot().actions,
      "a scenario that offers no actors had one served anyway — every " +
        "sibling module relies on this refusal"
    ).toEqual([]);
  });
});
