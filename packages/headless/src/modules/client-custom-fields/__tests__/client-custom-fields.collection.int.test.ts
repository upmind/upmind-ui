// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields definitions collection — read, state, controls (integration)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientCustomFields().as('self')` through the barrel
 * against MSW-replayed staging recordings and prove:
 * AC-1 the definitions request is exactly the brand-scoped catalogue URL;
 * AC-2 `brand_id` is the TARGET CLIENT's own brand, tracked per resolved
 *      client, never a fixed value;
 * AC-3 definitions come back ordered by `order` ascending;
 * AC-6 readiness is bounded and settles false on a definitions error and on
 *      a session that never authenticates, leaving nothing running;
 * AC-7 `invalidate()` re-reads only this module's own key;
 * AC-8 client-side filtering needs no new request;
 * AC-9 empty and non-empty counts are both reported;
 * AC-16 `resolveFieldByValue` prefers the embedded `value.field` and needs
 *      ZERO definitions requests to do it.
 *
 * ## What Breaks If These Fail
 * AC-2 failing is FE-2824's own shape one field over: the client's own
 * catalogue read against the SESSION's brand instead of theirs. AC-6 failing
 * hangs `client-personal-details`'s manager in `loading` forever (T-A6).
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
// Import order is load-bearing: this module's own barrel ("..") pulls in
// `../scope`'s scoped-composable factory, whose module graph reaches
// `session-store` → … → `client-email`'s EAGER top-level registration
// (`client-email/` is do-not-modify). Priming that whole graph via a
// REAL `session-store` import FIRST — never mocked here; these specs are
// the identity-seam read-back — resolves it before "..” ever touches
// `../scope` fresh. Precedent: `client-email.int-helpers.ts` imports
// `session-store` ahead of the module under test for the same reason.
// `import/order`'s parent-before-sibling default would undo this, so it is
// disabled for the two lines it would otherwise reorder ahead.
import {
  ClientCustomFieldsContextTypes,
  resolveFieldByValue,
  useClientCustomFields
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertRetargetIdentityTransport,
  installDefinitionsHandler,
  observeRequests,
  recorded,
  recordedDefinitions,
  recordedIds,
  resetClientCustomFieldsScopes,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";
import type { ICustomFieldValue } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientCustomFieldsScopes();
});

describe("client-custom-fields collection — AC-1/AC-2 brand-scoped read", () => {
  it("AC-1 reads the exact brand-scoped catalogue URL and every recorded row lands", async () => {
    const { clientId } = await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    const observed = observeRequests("/custom_fields");
    installDefinitionsHandler(server, realBrandId, recordedDefinitions());

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(fields.useContext().data.value).toHaveLength(
        recordedDefinitions().length
      )
    );
    observed.stop();

    const url = new URL(observed.first().url);
    expect(url.pathname).toContain("/custom_fields");
    expect(url.searchParams.get("filter[object_type]")).toBe("client");
    expect(url.searchParams.get("brand_id")).toBe(realBrandId);
    expect(url.searchParams.get("limit")).toBe("0");
    // AC-1, corrected: the oracle sends `order=order` — vue-app's
    // `customFields` store never sends `sort` on the custom-fields path
    // (customFields.vue:261-267) — and this module's own recorded capture
    // confirms `order=order&offset=0` is what staging actually answers. The
    // negative half (`sort` absent) is what catches a reintroduction of the
    // wrong param name.
    expect(url.searchParams.get("order")).toBe("order");
    expect(url.searchParams.has("sort")).toBe(false);
    void clientId;
  });

  /**
   * AC-2's literal "two different resolved clients get two different
   * brands" needs a SECOND real `GET clients/{id}` capture from a distinct
   * brand. This module has only one real client/brand pair recorded
   * (`recordedIds()`), and the replay server matches `GET clients/{id}...`
   * structurally regardless of the requested id — so a second session here
   * would replay the SAME fixture and prove nothing. That half is a
   * contract gap (reported in the hand-off), not faked here.
   *
   * What IS provable and asserted below: the `brand_id` sent is the REAL
   * resolved client record's own brand (this fixture's), not a fixed /
   * unrelated default — the mechanism AC-2 exists to protect.
   */
  it("AC-2 sends the RESOLVED CLIENT's own brand_id — the real client record's, not an unrelated fixed value", async () => {
    await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    const observed = observeRequests("/custom_fields");
    installDefinitionsHandler(server, realBrandId, recordedDefinitions());

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(fields.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    expect(new URL(observed.first().url).searchParams.get("brand_id")).toBe(
      realBrandId
    );
  });

  // AC-3's own read-back had its "request carries sort=order:asc" clause
  // removed (folded into AC-1, corrected above) — it is now purely the
  // CLIENT-SIDE ordering assertion; the request param deliberately stays
  // `order=order`.
  it("AC-3 exposes definitions client-side sorted by `order` ascending", async () => {
    await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    const scrambled = [...recordedDefinitions()].reverse();
    installDefinitionsHandler(server, realBrandId, scrambled);

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(fields.useContext().data.value).toHaveLength(scrambled.length)
    );

    const orders = fields.useContext().data.value.map(field => field.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  /**
   * The AC-2 retarget read-back (A7, verify-reality-check.companion.md).
   * Every OTHER spec in this suite calls `.as(SELF)`, for which
   * `scopeContext` is `undefined` and `resolveClientId` always takes the
   * session arm — identical to what `session-hardwired-id.must-fail.patch`
   * hardwires. The matrix's live cell is `CLIENT → VALUES`, so
   * `.as(CLIENT).for(VALUES, someOtherId)` compiles and genuinely retargets;
   * this spec is what exercises that path instead of leaving it dormant.
   *
   * Confirmed empirically (not asserted on the fixture's OWN response body,
   * per A7 — only the outbound wire): retargeting changes the OUTBOUND
   * `GET clients/{id}?with=custom_fields,custom_fields.field` URL to carry
   * the TARGET id, never the session client's, while the bearer token stays
   * the session's own (an entity retarget, never an actor swap — no second
   * token, no acting-as header). A 403 from staging for a real cross-client
   * read would be a perfectly good capture; the assertion is on the request
   * that went out, never a response payload.
   */
  it("AC-2 retargeting to another client's VALUES context addresses that client's own resource, on the session's own token", async () => {
    const { accessToken } = await seedClientSession();
    const { clientId: sessionClientId, brandId: realBrandId } = recordedIds();
    const targetId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    installDefinitionsHandler(server, realBrandId, recordedDefinitions());
    const observed = observeRequests("/clients/");

    const fields = useClientCustomFields()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCustomFieldsContextTypes.VALUES, targetId);
    await fields.useActions().isReady();
    observed.stop();

    const retargeted = observed
      .all()
      .find(request => request.url.includes(`/clients/${targetId}`));
    expect(
      retargeted,
      `No request addressed to the retargeted client ${targetId}. Observed: ${JSON.stringify(observed.all().map(r => r.url))}`
    ).toBeDefined();
    assertRetargetIdentityTransport(retargeted!, targetId, accessToken);

    // The read-back is the REQUEST, never the response: this scope's own id
    // is the target's, never the session's own.
    const addressedSession = observed
      .all()
      .some(request => request.url.includes(`/clients/${sessionClientId}`));
    expect(addressedSession).toBe(false);
  });
});

describe("client-custom-fields collection — AC-6 bounded, error-settling readiness", () => {
  it("AC-6a settles false when the definitions request fails, and leaves nothing running", async () => {
    await seedClientSession();
    server?.use(
      http.get("*/custom_fields", () =>
        HttpResponse.json(
          { status: "error", error: { code: 500 } },
          { status: 500 }
        )
      )
    );

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    const settled = await Promise.race([
      fields.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(false);
  });

  // AC-6b (never-authenticated settles false) moved to
  // `client-custom-fields.guard.int.test.ts`, which — like
  // `client-email.guard.int.test.ts` — never seeds a session in ANY of its
  // tests. A session seeded earlier IN THIS FILE persists across `it()`s
  // (only the scope registry + query cache are reset in `afterEach`, not
  // session-store's own authentication), so "the session never
  // authenticates" cannot be this file's own precondition once any sibling
  // test has authenticated.

  /**
   * AC-6c — the failure path AC-6a cannot reach. AC-6a injects on
   * `/custom_fields`, which never leaves the brand read unresolved; this
   * spec injects on `GET clients/{id}` — the SEPARATE brand-read request
   * `resolveClientId`'s brand resolution depends on (see AC-2's own
   * fileoverview note on that same request). A failed brand read must still
   * settle `isReady()` false within a bound, never leaving the collection
   * disabled-and-unfetched forever, and the mapped error must stay
   * reachable afterwards — never a silently wedged, permanently-disabled
   * query.
   */
  it("AC-6c settles false, bounded, when the brand read (GET clients/{id}) fails — not just when /custom_fields does", async () => {
    await seedClientSession();
    // Injects on the brand read (GET clients/{id}) — never on
    // /custom_fields, which is AC-6a's own injection point and does not
    // reach this defect. No image call happens in this spec, so a single
    // `*/clients/*` GET override is unambiguous.
    server?.use(
      http.get("*/clients/*", () =>
        HttpResponse.json(
          { status: "error", error: { code: 500 } },
          { status: 500 }
        )
      )
    );

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    // BOUNDED, not AC-6a's own 3s — the brand-read query retries with
    // backoff before the guard settles it, taking longer in practice than
    // the /custom_fields failure path AC-6a covers. Still a hard bound,
    // never `Infinity`, and well inside this file's 30s test timeout.
    const settled = await Promise.race([
      fields.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 15000))
    ]);

    expect(settled).toBe(false);

    // The mapped brand error stays reachable — the collection is not left
    // permanently disabled-and-unfetched with no way for a consumer to see
    // what went wrong.
    await vi.waitFor(() => expect(fields.useMeta().hasError.value).toBe(true), {
      timeout: 15000
    });
    expect(fields.useContext().error.value).toBeTruthy();
  }, 20000);
});

describe("client-custom-fields collection — AC-7 scoped invalidation, AC-8 client-side filter, AC-9 empty/count", () => {
  it("AC-7 invalidate() re-reads only this module's own key", async () => {
    await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    const handler = installDefinitionsHandler(
      server,
      realBrandId,
      recordedDefinitions()
    );

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await fields.useActions().isReady();
    const before = handler.reads();

    await fields.useActions().invalidate();

    await vi.waitFor(() => expect(handler.reads()).toBeGreaterThan(before));
  });

  it("AC-8 filters the loaded list in-memory with no new request", async () => {
    await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    const handler = installDefinitionsHandler(
      server,
      realBrandId,
      recordedDefinitions()
    );

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await fields.useActions().isReady();
    const before = handler.reads();

    // `narrowBy` is declared `void` (a SETTER, not a return-the-filtered-
    // list accessor) — the exposed filtered list is read back through
    // `useContext().data`, per AC-8's own read-back.
    fields.useActions().narrowBy({ code: "age" });

    expect(fields.useContext().data.value).toHaveLength(1);
    expect(fields.useContext().data.value[0].code).toBe("age");
    expect(handler.reads()).toBe(before);
  });

  it("AC-9 reports an empty catalogue as empty with a count of zero", async () => {
    await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    installDefinitionsHandler(server, realBrandId, []);

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await fields.useActions().isReady();

    expect(fields.useMeta().isEmpty.value).toBe(true);
    expect(fields.useMeta().count.value).toBe(0);
  });

  it("AC-9 reports a real non-empty catalogue's exact count", async () => {
    await seedClientSession();
    const { brandId: realBrandId } = recordedIds();
    installDefinitionsHandler(server, realBrandId, recordedDefinitions());

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);
    await fields.useActions().isReady();

    expect(fields.useMeta().isEmpty.value).toBe(false);
    expect(fields.useMeta().count.value).toBe(recordedDefinitions().length);
  });
});

describe("client-custom-fields — AC-16 resolveFieldByValue prefers the embedded field, zero requests", () => {
  it("AC-16 resolves a value's definition from its OWN embedded field with the collection unloaded", async () => {
    await seedClientSession();
    const observed = observeRequests("/custom_fields");

    const embedded = recorded
      .withValues()
      .data.custom_fields.find(
        row => row.field
      ) as unknown as ICustomFieldValue;

    const resolved = resolveFieldByValue(embedded);
    // Give an (incorrectly) eager collection load time to fire before asserting.
    await new Promise(resolve => setTimeout(resolve, 200));
    observed.stop();

    expect(resolved?.code).toBe(embedded.field?.code);
    expect(observed.count()).toBe(0);
  });
});
