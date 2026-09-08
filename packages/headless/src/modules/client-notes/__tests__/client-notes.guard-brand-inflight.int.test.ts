// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.guard-brand-inflight.int
 * @description AC-33 — isReady() while the session has settled but the
 * brand's own config has not yet landed. Isolated in its own file for the
 * SAME reason as `client-notes.guard-brand-disabled.int.test.ts`: `useBrand()`
 * is a real module-level singleton with a `staleTime: "static"` query and a
 * debounced localStorage persister, so gating its resolution here must never
 * race an already-settled brand fetch left behind by an earlier file's test.
 *
 * `useBrand().ensureConfig` — the exact seam `client-notes.int-helpers.ts`'s
 * own `waitForAvailable` docblock names as the async term `isAvailable`
 * composes — is intercepted directly (mirroring the `../../feedback` mock
 * pattern in `client-notes.mutations.int.test.ts`'s sibling modules) rather
 * than raced through MSW: a delayed MSW handler could not be proven to
 * reach the wire ahead of `useBrand`'s own persisted-cache short-circuit,
 * so the seam the module itself documents is gated directly instead.
 *
 * ## Job To Be Done
 * Before the fix, the module's availability predicate read the brand-config
 * term SYNCHRONOUSLY, so with the session settled but the brand config still
 * in flight, `isReady()` resolved a SETTLED `false` — reporting no vault a
 * tick before the list would have loaded fine. Prove `isReady()` now AWAITS
 * the brand config rather than racing it: while the config is in flight it
 * must not resolve false, and once the config lands it resolves true.
 *
 * ## What Breaks If This Fails
 * A client with vault access flashes "vault not available" on every page
 * load, purely because the brand's own settings network call had not yet
 * returned — a false negative on the JTBD sentence itself.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientNotes } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  resetClientNoteScopes,
  seedClientSession
} from "./client-notes.int-helpers";

// -----------------------------------------------------------------------------

const brandGate = vi.hoisted(() => {
  let release: () => void = () => undefined;
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
});

vi.mock("../../brand", async importOriginal => {
  const actual = await importOriginal<typeof import("../../brand")>();
  return {
    ...actual,
    useBrand: (...args: unknown[]) => {
      const api = (
        actual.useBrand as unknown as (
          ...a: unknown[]
        ) => Record<string, unknown>
      )(...args);
      return new Proxy(api, {
        get(target, property) {
          if (property === "ensureConfig") {
            return async (...callArgs: unknown[]) => {
              await brandGate.promise;
              return (target.ensureConfig as (...a: unknown[]) => unknown)(
                ...callArgs
              );
            };
          }
          return Reflect.get(target, property);
        }
      });
    }
  };
});

// -----------------------------------------------------------------------------

describe("client-notes guard rails — useClientNotes (brand config in flight, isolated)", () => {
  it("AC-33 — isReady() does not resolve settled false while the brand config is still in flight, and resolves true once it lands", async () => {
    resetClientNoteScopes();
    await seedClientSession();

    const notes = useClientNotes().as(ScopeActorTypes.SELF);

    let settledValue: unknown = "never-settled";
    const isReadyPromise = notes
      .useActions()
      .isReady()
      .then(value => {
        settledValue = value;
        return value;
      });

    await new Promise(resolve => setTimeout(resolve, 300));
    expect(settledValue).toBe("never-settled");

    brandGate.release();
    const resolved = await isReadyPromise;

    expect(resolved).toBe(true);
    expect(settledValue).toBe(true);
  });
});
