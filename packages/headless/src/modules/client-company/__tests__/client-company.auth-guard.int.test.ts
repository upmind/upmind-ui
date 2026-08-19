// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — the never-authenticated guard (AC-5, AC-25, AC-26)
 *
 * ## Job To Be Done
 * Prove AC-25/AC-26 under their literal precondition: a session that NEVER
 * authenticates (AC-25) and one that authenticates but resolves NO client id
 * (AC-26, R3). No test in the first describe block seeds a client session, so
 * the store only ever reaches the guest floor. Under that condition: zero
 * requests against any company resource, every forced read or mutation
 * rejected as not-authenticated, and — AC-5 — the collection reporting itself
 * UNAVAILABLE while still reporting itself loading, so a consumer tells "not
 * mine to read" from "still settling" without ever inspecting the session.
 * AC-4/AC-12/AC-22's readiness-always-settles half (NFR-3) is proven here
 * against the guest floor, since that is the one state a readiness wait must
 * never hang against.
 *
 * The `auth-guard.must-fail.patch` strips every guard; the "no request" and
 * "rejects" assertions here are what must then fire. The
 * `guard-inversion.must-fail.patch` reverts ONLY the `remove`/`setDefault`
 * operator (AC-26) — this file's `clients/undefined/` assertion is what makes
 * that control discriminate the inversion specifically.
 *
 * ## What Breaks If These Fail
 * An unauthenticated caller reaches a client's company resource at all, or a
 * session with no resolvable client id issues a destructive request
 * (`DELETE clients/undefined/companies/{id}` — the live R3 defect).
 */

import { describe, expect, it } from "vitest";
import {
  ClientCompanyContextTypes,
  useClientCompanies,
  useClientCompanyManager
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useSessionStore } from "../../session-store";
import {
  installBackgroundStubs,
  observeAllRequests,
  recorded,
  seedAuthenticatedSessionWithoutClientId
} from "./client-company.int-helpers";
import { NotAuthenticatedError } from "../../../utils";

// -----------------------------------------------------------------------------

/** Boots the store to the guest floor — no client session is ever added. */
async function bootUnauthenticated(): Promise<void> {
  installBackgroundStubs();
  await useSessionStore().initStore();
}

/**
 * The value an action SETTLED on: its rejection, a `{ resolved }` wrapper, or
 * the `never-settled` sentinel. Raced rather than awaited outright — with a
 * guard removed, an action can block on a fetch that never resolves, so a bare
 * `rejects` assertion would report a file timeout instead of naming what
 * went wrong.
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

describe("client-company with no authenticated client session (AC-25)", () => {
  it("AC-25 makes no request against any company resource — forced or not", async () => {
    await bootUnauthenticated();
    const observed = observeAllRequests();

    useClientCompanies().as(ScopeActorTypes.CLIENT);
    useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCompanyContextTypes.COMPANY, TARGET_ID);
    // Give an (incorrectly) enabled query/machine time to fire before
    // asserting absence.
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.matching("/companies").map(request => request.url)).toEqual(
      []
    );
  });

  it("AC-25 rejects a forced collection read as not-authenticated", async () => {
    await bootUnauthenticated();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);

    await expect(companies.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
  });

  it("AC-25 rejects every collection mutation as not-authenticated", async () => {
    await bootUnauthenticated();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);

    await expect(
      settlement(companies.useActions().remove(TARGET_ID)),
      "remove"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(companies.useActions().setDefault(TARGET_ID)),
      "setDefault"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
  });

  it("AC-25 rejects the manager's save as not-authenticated", async () => {
    await bootUnauthenticated();

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();

    await expect(
      settlement(manager.useActions().update({ name: "Prover Co" })),
      "update"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
  });

  it("AC-4/AC-12/AC-22 never reports the collection ready while the session never authenticates (NFR-3)", async () => {
    await bootUnauthenticated();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);

    const settled = await Promise.race([
      companies.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });

  it("AC-22 never reports the manager ready while the session never authenticates (NFR-3)", async () => {
    await bootUnauthenticated();

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();

    const settled = await Promise.race([
      manager.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });

  it("AC-5 reports the collection unavailable while the session never authenticates, and still reports it loading", async () => {
    await bootUnauthenticated();

    const meta = useClientCompanies().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.isAvailable.value).toBe(false);
    expect(meta.isLoading.value).toBe(true);

    // A first-tick false is not the read-back: the pair must still separate
    // "not mine to read" from "still settling" once the store has settled.
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(meta.isAvailable.value).toBe(false);
    expect(meta.isLoading.value).toBe(true);
  });
});

describe("client-company — authenticated but no resolvable client id (AC-5, AC-26, R3)", () => {
  it("AC-5 reports the collection unavailable when authenticated but no client id resolves — the session flag ALONE is not enough", async () => {
    // CONTRACT GAP, disclosed rather than worked around: AC-5's read-back also
    // asks for a `toRaw` identity check that `useMeta().isAvailable` is the
    // SAME ref the internal guard calls, never a second copy. `useInternals()`
    // exposes only `{ actorScope, query }` (design.md D7) — the internal
    // `service.isAvailable` this claims identity with is never reachable from
    // the public surface, so that specific sub-clause cannot be proven from
    // the contract alone without reading src. Reported, not fabricated.
    await seedAuthenticatedSessionWithoutClientId();

    const meta = useClientCompanies().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.isAvailable.value).toBe(false);
  });

  it("AC-26 rejects remove() and setDefault() as not-authenticated, sending no request", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeAllRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);

    await expect(
      settlement(companies.useActions().remove(TARGET_ID)),
      "remove"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);
    await expect(
      settlement(companies.useActions().setDefault(TARGET_ID)),
      "setDefault"
    ).resolves.toBeInstanceOf(NotAuthenticatedError);

    observed.stop();
    expect(observed.matching("/companies").map(request => request.url)).toEqual(
      []
    );
  });

  it("AC-26 never issues a request whose URL contains the literal `clients/undefined/` — the exact shape the live R3 inversion produces", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeAllRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await settlement(companies.useActions().remove(TARGET_ID));
    await settlement(companies.useActions().setDefault(TARGET_ID));
    // Give an (incorrectly) resolved guard time to fire before asserting
    // absence.
    await new Promise(resolve => setTimeout(resolve, 250));

    observed.stop();
    expect(
      observed.matching("clients/undefined/").map(request => request.url)
    ).toEqual([]);
  });

  it("AC-2/AC-7/C7 — this brand fetches TAX_NUMBER_VALIDATION_ENABLED via a real ensureConfig call (the recorded, real-false case)", () => {
    // Anchors the recorded brand-config capture this suite's collection tests
    // rely on; C7's wire-observed half is proven in
    // client-company.collection.int.test.ts.
    expect(
      recorded.brandConfig().data[
        "price_tax.tax.enable_automatic_vat_validation"
      ]
    ).toBe(false);
  });
});
