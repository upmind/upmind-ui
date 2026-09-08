// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.guard-brand-transient.int
 * @description AC-39 — the vault COLLECTION carries NO boot-time brand-config
 * dependency. It boots available on the reactive `isAddressable` path, and the
 * async product lookup is deferred behind the control (design.md Layer 3), so
 * the old eager product fetch — the one boot-time client-notes `ensureConfig`
 * caller — no longer fires at boot. (The original "recover from a transient
 * brand-config rejection" framing is retired: a brand-config load failure is an
 * app-wide fatal, not a vault-recoverable transient.) Isolated in its own file
 * for the SAME reason
 * as `client-notes.guard-brand-disabled.int.test.ts` and
 * `client-notes.guard-brand-inflight.int.test.ts`: `useBrand()` is a real
 * module-level singleton with a `staleTime: "static"` query and a debounced
 * localStorage persister (`review-notes.md` §H2), so a failure injected here
 * must never leak into a neighbouring file's brand-dependent test.
 *
 * `useBrand().ensureConfig` is intercepted directly (the same seam
 * `client-notes.guard-brand-inflight.int.test.ts` gates), rather than raced
 * through an MSW 500 on the underlying HTTP call, for the identical reason
 * that file states: a persisted-cache short-circuit cannot be proven to lose
 * a race against a delayed/failing MSW handler, so the documented seam is
 * gated directly instead.
 *
 * ## Job To Be Done
 * Prove the collection has NO boot-time `ensureConfig` dependency: with
 * `ensureConfig` booby-trapped to reject on its first call, the vault still
 * reaches `isAvailable: true` and loads its list, and the trap is never tripped
 * (`ensureConfigCalls.count === 0`). The collection's `enabled`/`guard` read
 * `isAddressable` synchronously and re-evaluate reactively; the only boot-time
 * client-notes caller of `ensureConfig` was the eager product fetch, now
 * deferred behind the control.
 *
 * ## What Breaks If This Fails
 * A reverted deferral — an eager product/lookup fetch back at boot — re-couples
 * the collection's boot to `ensureConfig` (`count` flips to ≥ 1), re-embedding
 * the very boot-time dependency this story removed.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientNotes } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  recorded,
  resetClientNoteScopes,
  seedClientSession
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const ensureConfigCalls = vi.hoisted(() => ({ count: 0 }));

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
              ensureConfigCalls.count += 1;
              if (ensureConfigCalls.count === 1) {
                throw new Error("simulated transient brand-config failure");
              }
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

describe("client-notes guard rails — useClientNotes (transient brand-config rejection, isolated)", () => {
  it("AC-39 — the collection boots available without any eager brand-config await (the deferred lookup removed the boot dependency)", async () => {
    resetClientNoteScopes();
    await seedClientSession();
    server?.use(
      http.get("*/clients/*/vault", () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const notes = useClientNotes().as(ScopeActorTypes.SELF);

    // `ensureConfig` is booby-trapped to reject on its first call. The
    // collection's `enabled`/`guard` read `isAddressable` synchronously off
    // already-cached config and never await `ensureConfig`, and the old eager
    // product fetch — the one boot-time client-notes caller — is now deferred
    // behind the control (design.md Layer 3). So the boot never trips the trap:
    // the vault reaches `isAvailable: true` and loads its list on the reactive
    // path alone.
    await vi.waitFor(
      () => {
        expect(notes.useMeta().isAvailable.value).toBe(true);
      },
      { timeout: 5000, interval: 25 }
    );

    expect(notes.useContext().data.value?.length).toBeGreaterThan(0);
    // ZERO eager `ensureConfig` calls at boot — the discriminating signal that
    // the collection carries no boot-time brand-config dependency. A reverted
    // deferral (an eager lookup fetch back at boot) would call `ensureConfig`
    // and flip this to ≥ 1.
    expect(ensureConfigCalls.count).toBe(0);

    notes.useActions().destroy();
  });
});
