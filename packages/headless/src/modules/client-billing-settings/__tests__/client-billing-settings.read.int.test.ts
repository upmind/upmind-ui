// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings read half — the query, its identity
 * seam, cross-module sharing, and error settlement (AC-1, AC-2, AC-16, AC-19)
 *
 * ## Job To Be Done
 * Drive the REAL `useBillingSettings()` THROUGH THE BARREL against
 * MSW-replayed staging recordings and prove: the read carries the client's
 * ACTUAL saved values, addressed to the scope-resolved client id and never a
 * hardwired one — the A7 read-back, request URL AND auth identity transport,
 * never the response payload alone (AC-1); the read re-seeds when the
 * addressed client id changes rather than serving the previous client's
 * values (AC-2); a third observer on the SHARED `["client", id, "record"]`
 * cache key costs zero extra requests and cannot change what a sibling
 * module (`client-personal-details`) sees (AC-19); and a failed read settles
 * with a visible error rather than hanging, then a retry lands the real
 * values (AC-16).
 *
 * ## What Breaks If These Fail
 * The FE-2824 shape: a read that can silently address a different client, a
 * shared cache key that lets one module's read scramble another's
 * projection, or a read that never actually reaches the wire (the JTBD's
 * first verb, absent per `requirements.md` §7.1).
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
// Primed by import order (not mocked): the real `session-store` must resolve
// BEFORE this module's own barrel is imported, or the transitive walk
// `../scope` -> `session-store` -> `query` -> `basket` -> `client-company` ->
// `client-email` re-enters `../scope` mid-evaluation and
// `createScopedComposable` is undefined at the crash site — the same
// load-order landmine `client-personal-details.read.int.test.ts` documents.
// Import the helpers (which import `session-store`) before the module under
// test; sorting this block alphabetically regresses the whole suite.
import { useBillingSettings } from "..";
import { usePersonalDetails } from "../../client-personal-details";
import { resetClientPersonalDetailsScopes } from "../../client-personal-details/__tests__/client-personal-details.int-helpers";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { ClientBillingSettingsContextTypes } from "../client-billing-settings.types";
import {
  assertClientIdentityTransport,
  observeClientRequests,
  recorded,
  resetClientBillingSettingsScopes,
  seedClientSession
} from "./client-billing-settings.int-helpers";
import { recordingsDir, server } from "./setup.integration";
import type { IClient } from "@upmind-automation/types";
import type { Envelope } from "./client-billing-settings.int-helpers";

// -----------------------------------------------------------------------------

/** A constructed id, deliberately distinct from the session's real client id. */
const OTHER_CLIENT_ID = "22223333-4444-5555-6666-777788889999";

function ownRecordQueryDataUpdateCount(clientId: string): number {
  const key = JSON.stringify(["client", clientId, "record"]);
  const entry = queryClient
    .getQueryCache()
    .getAll()
    .find(query => JSON.stringify(query.queryKey) === key);
  return entry?.state.dataUpdateCount ?? 0;
}

/**
 * The recorded settings envelope, re-addressed to the constructed other id —
 * a plain fixture-derived value (never a function wrapper) so its ONE field
 * override stays visibly sourced from `getFixtureBody`, not manufactured.
 */
const otherClientSettingsFixture = getFixtureBody<Envelope<IClient>>(
  "get-clients-id",
  { recordingsDir }
);
const otherClientEnvelope: Envelope<IClient> = {
  ...otherClientSettingsFixture,
  data: { ...otherClientSettingsFixture.data, id: OTHER_CLIENT_ID }
};

// -----------------------------------------------------------------------------

describe("useBillingSettings — my actual saved values (AC-1)", () => {
  it("AC1 reads the five consolidation values off the addressed client record", async () => {
    const { clientId, accessToken } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.settings(), { status: 200 })
      )
    );
    const observed = observeClientRequests();

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    observed.stop();
    const read = observed.all().find(request => request.method === "GET");
    expect(read).toBeDefined();
    assertClientIdentityTransport(read!, clientId, accessToken);

    const fixture = recorded.settings().data;
    const record = settings.useContext().data.value;
    expect(record.enabled).toBe(fixture.invoice_consolidation_enabled);
    expect(record.baseRule).toBe(fixture.invoice_consolidation_base_rule);
    expect(record.dayOfWeek).toBe(
      fixture.invoice_consolidation_base_rule_day_of_week
    );
    expect(record.dateOfMonthDay).toBe(
      fixture.invoice_consolidation_base_rule_date_of_month_day
    );
    expect(record.dueDateDay).toBe(fixture.invoice_consolidation_due_date_day);
  });
});

describe("useBillingSettings — re-seeding on a changed client (AC-2)", () => {
  it("AC2 re-seeds when the addressed client id changes", async () => {
    const { clientId: sessionClientId, accessToken } =
      await seedClientSession();
    server?.use(
      http.get(`*/clients/${sessionClientId}`, () =>
        HttpResponse.json(recorded.settings(), { status: 200 })
      ),
      http.get(`*/clients/${OTHER_CLIENT_ID}`, () =>
        // eslint-disable-next-line scope-based/no-hand-rolled-int-fixture
        HttpResponse.json(otherClientEnvelope, { status: 200 })
      )
    );
    const observed = observeClientRequests();

    const sessionOwn = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await sessionOwn.useActions().isReady();

    const retargeted = useBillingSettings()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientBillingSettingsContextTypes.SETTINGS, OTHER_CLIENT_ID);
    await retargeted.useActions().isReady();

    observed.stop();
    const requests = observed.all();
    expect(
      requests.some(request =>
        request.url.includes(`/clients/${OTHER_CLIENT_ID}`)
      )
    ).toBe(true);
    for (const request of requests.filter(request =>
      request.url.includes(OTHER_CLIENT_ID)
    )) {
      assertClientIdentityTransport(request, OTHER_CLIENT_ID, accessToken);
    }

    const otherFixture = otherClientEnvelope.data;
    expect(retargeted.useContext().data.value.enabled).toBe(
      otherFixture.invoice_consolidation_enabled
    );
    // The FIRST composable's own values are untouched by the retarget.
    const ownFixture = recorded.settings().data;
    expect(sessionOwn.useContext().data.value.enabled).toBe(
      ownFixture.invoice_consolidation_enabled
    );
  });
});

describe("useBillingSettings — sharing the client-record cache key (AC-19)", () => {
  it("AC19 shares the client-record cache key without extra requests or cross-projection", async () => {
    const { clientId } = await seedClientSession();
    // A stale `client-personal-details` instance surviving from an earlier
    // test elsewhere in this run would hold a reference to a now-cleared
    // query — reset ITS OWN registry too, so this test mounts a genuinely
    // fresh instance rather than an orphaned observer.
    resetClientPersonalDetailsScopes();
    const read = server?.use
      ? (() => {
          let reads = 0;
          server.use(
            http.get(`*/clients/${clientId}`, () => {
              reads += 1;
              return HttpResponse.json(recorded.settings(), { status: 200 });
            })
          );
          return { reads: () => reads };
        })()
      : { reads: () => 0 };

    const billing = useBillingSettings().as(ScopeActorTypes.CLIENT);
    const personal = usePersonalDetails().as(ScopeActorTypes.SELF);

    await Promise.all([
      billing.useActions().isReady(),
      personal.useActions().isReady()
    ]);

    // A raw request-count over `/clients/` is the WRONG instrument here:
    // `client-personal-details` performs its own additional, deliberately
    // non-deduped locale-scoped read against the identical wire URL (its own
    // `read.int.test.ts` docblock names this), which lands under a LONGER
    // cache key and would inflate a raw counter without ever touching the
    // SHARED key this AC actually claims. Scoping to the shared key's own
    // `dataUpdateCount` is what actually answers "did the shared key itself
    // see more than one fetch" — the same technique the exemplar uses.
    expect(read.reads()).toBeGreaterThanOrEqual(1);
    expect(ownRecordQueryDataUpdateCount(clientId)).toBe(1);

    const fixture = recorded.settings().data;
    expect(billing.useContext().data.value.enabled).toBe(
      fixture.invoice_consolidation_enabled
    );

    // The shared entry itself must hold the RAW client record — never
    // either observer's OWN `select:` projection. A poisoned key (design.md
    // §5.2's `get()` hazard) would instead store the FIRST caller's mapped
    // shape, so this reads the cache directly rather than trusting a
    // projection to prove what is stored under it.
    const sharedEntry = queryClient
      .getQueryCache()
      .getAll()
      .find(
        query =>
          JSON.stringify(query.queryKey) ===
          JSON.stringify(["client", clientId, "record"])
      );
    const storedRaw = sharedEntry?.state.data as Partial<IClient> | undefined;
    expect(storedRaw).toHaveProperty(
      "invoice_consolidation_enabled",
      fixture.invoice_consolidation_enabled
    );
    expect(storedRaw).not.toHaveProperty("enabled");

    // `usePersonalDetails`'s OWN projection is untouched by billing's
    // `select:` having run against the same raw entry.
    expect(Array.isArray(personal.useContext().data.value)).toBe(true);
    expect(personal.useContext().data.value.length).toBeGreaterThan(0);

    personal.useActions().destroy();
  });
});

describe("useBillingSettings — settling on error and retrying (AC-16)", () => {
  it("AC16 a failed read settles with an error and retries green", async () => {
    const { clientId } = await seedClientSession();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json({ status: "error", data: null }, { status: 500 })
      )
    );

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    const settled = await Promise.race([
      settings.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 20000))
    ]);

    expect(settled).toBe(false);
    expect(settings.useMeta().hasErrors.value).toBe(true);

    resetClientBillingSettingsScopes();
    server?.use(
      http.get(`*/clients/${clientId}`, () =>
        HttpResponse.json(recorded.settings(), { status: 200 })
      )
    );
    const retried = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await retried.useActions().refresh();
    await retried.useActions().isReady();

    const fixture = recorded.settings().data;
    expect(retried.useContext().data.value.enabled).toBe(
      fixture.invoice_consolidation_enabled
    );
  }, 25000);
});
