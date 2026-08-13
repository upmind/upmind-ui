// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the never-authenticated guard (AC-15)
 *
 * ## Job To Be Done
 * Prove AC-15 under its literal precondition: a session that NEVER
 * authenticates. No test in this file seeds a client session, and vitest
 * isolates each test file, so the store here only ever reaches the guest
 * floor. Under that condition: zero requests against any client's phone
 * resource, every forced read or mutation rejected as not-authenticated, the
 * collection never reporting itself ready, and the collection reporting
 * itself UNAVAILABLE while still reporting itself loading, so a consumer
 * tells "not mine to read" from "still settling" without ever inspecting the
 * session.
 *
 * The `client-id-limb.must-fail.patch` weakens `isAddressable` to
 * `isAuthenticated` alone (decision D-2, row W5 — the latent `||` bug this
 * conversion fixed rather than reproduced); the "no request" and "rejects"
 * assertions here are what must then fire red.
 *
 * ## What Breaks If These Fail
 * An unauthenticated caller reaches a client's phone collection at all — the
 * one thing legacy's `<guard :if-client>` never allowed.
 */

import { describe, expect, it } from "vitest";
import { useClientPhoneManager, useClientPhones } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import { ClientPhoneContextTypes } from "../client-phone.types";
import {
  installBackgroundStubs,
  observePhoneRequests,
  recorded,
  seedAuthenticatedSessionWithoutClientId
} from "./client-phone.int-helpers";
import { NotAuthenticatedError } from "../../../utils";

// -----------------------------------------------------------------------------

/** Boots the store to the guest floor — no client session is ever added. */
async function bootUnauthenticated(): Promise<void> {
  installBackgroundStubs();
  await useSessionStore().initStore();
}

/**
 * The value an action SETTLED on: its rejection, a `{ resolved }` wrapper, or
 * the `never-settled` sentinel. Raced rather than awaited outright — with the
 * guard removed, a mutation could block on a list read that never resolves,
 * so a bare `rejects` assertion would report a file timeout instead of
 * naming what went wrong.
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

// -----------------------------------------------------------------------------

describe("client-phone with no authenticated client session (AC-15)", () => {
  it("AC-15 makes no request against any client's phone resource", async () => {
    await bootUnauthenticated();
    const observed = observePhoneRequests();

    useClientPhones().as(ScopeActorTypes.SELF);
    useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, recorded.one().data.id);
    // Give an (incorrectly) enabled query time to fire before asserting absence.
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
  });

  it("AC-15 rejects a forced read as not-authenticated", async () => {
    await bootUnauthenticated();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);

    await expect(phones.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
  });

  it("AC-15 rejects every mutation as not-authenticated", async () => {
    await bootUnauthenticated();
    const target = recorded.one().data;

    const phones = useClientPhones().as(ScopeActorTypes.SELF);

    await expect(
      settlement(
        phones.useActions().ensure({
          phone: {
            number: null,
            nationalNumber: target.phone,
            countryCallingCode: target.phone_code.replace("+", ""),
            country: target.phone_country_code
          }
        })
      ),
      "ensure"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(phones.useActions().remove(target.id)),
      "remove"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(phones.useActions().setDefault(target.id)),
      "setDefault"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
  });

  it("AC-15 never reports the collection ready while the session never authenticates", async () => {
    await bootUnauthenticated();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);

    const settled = await Promise.race([
      phones.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });

  it("AC-3 reports the collection unavailable while the session never authenticates, and still reports it loading", async () => {
    await bootUnauthenticated();

    const meta = useClientPhones().as(ScopeActorTypes.SELF).useMeta();

    expect(meta.isAvailable.value).toBe(false);
    expect(meta.isLoading.value).toBe(true);

    // A first-tick false is not the read-back: the pair must still separate
    // "not mine to read" from "still settling" once the store has settled.
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(meta.isAvailable.value).toBe(false);
    expect(meta.isLoading.value).toBe(true);
  });

  it("AC-28 the manager holds in subscribing and sends nothing before an identity resolves", async () => {
    await bootUnauthenticated();
    const target = recorded.one().data;
    const observed = observePhoneRequests();

    const manager = useClientPhoneManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientPhoneContextTypes.PHONE, target.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(manager.useInternals().state.value.matches("subscribing")).toBe(
      true
    );
    expect(manager.useMeta().isAvailable.value).toBe(false);
  });
});

describe("client-phone with an authenticated session but no resolved client id (AC-15)", () => {
  // The `client-id-limb.must-fail.patch` weakens `isAddressable` from
  // `isAuthenticated && !!clientId` to `isAuthenticated` alone. Every
  // scenario ABOVE this block never authenticates at all, so `isAuthenticated`
  // is false regardless of the mutant and cannot tell the two shapes apart —
  // only a session that DOES authenticate but resolves no client id
  // distinguishes them (decision D-2, row W5's second limb).
  it("AC-15 reports the collection unavailable and fires no request, even though the session IS authenticated", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observePhoneRequests();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(phones.useMeta().isAvailable.value).toBe(false);
    expect(observed.all().map(request => request.url)).toEqual([]);
  });

  it("AC-15 rejects a forced read as not-authenticated, even though the session IS authenticated", async () => {
    await seedAuthenticatedSessionWithoutClientId();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);

    await expect(phones.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
  });
});
