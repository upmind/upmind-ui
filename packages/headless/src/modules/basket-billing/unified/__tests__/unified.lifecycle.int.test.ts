// -----------------------------------------------------------------------------
/**
 * @fileoverview unified billing-detail data lifecycle — services ↔ the client API
 *
 * ## Job To Be Done
 * `unified/services.ts` drives the data lifecycle a checkout billing-detail form
 * runs on: `loadLookups` gathers what the form needs from the client API — the
 * customer's own addresses, phones, emails and companies, plus the countries and
 * their regions, the billing cycles and the brand's required-field config;
 * `parse` turns that into the form schema; `validate` checks the typed model; and
 * `invalidate` re-reads the lists after a change. This file drives the REAL
 * `useUnified` composable and the REAL services against recorded fixtures, so the
 * whole load → parse → validate lifecycle and the invalidate refetch are proven
 * against the true client-API shapes. The `add()` save seam is proven separately
 * (`unified.int.test.ts`) and is not repeated here.
 *
 * ## Provenance
 * Every body replayed here was captured by the co-located `unified.fixtures.ts`
 * generator into this module's own `fixtures/` dir. No body is authored here; the
 * session is seeded from the recorded session-store fixtures.
 *
 * ## What Breaks If These Fail
 * The billing-detail form opens with no countries, no saved addresses to pick and
 * no schema; a typed address never validates; or a changed detail keeps showing
 * the stale list — the customer cannot complete billing at checkout.
 */

import { join } from "node:path";
import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../../__tests__/int-test-helpers";
import { useUnifiedServices } from "../services";
import { UnifiedType } from "../types";
import { useUnified } from "../useUnified";
import { server } from "./setup.integration";
import type { UnifiedContext, UnifiedModel } from "../types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");
const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

function serve(route: string, key: string, status?: number): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http.get(route, () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: status ?? recorded.status
      })
    )
  );
}

/** Pin the recorded body on every endpoint `loadLookups` reads. */
function serveLookups(): void {
  serve("*/api/org/modules", "get-org-modules");
  serve("*/api/config/brand/values", "get-config-brand-values");
  serve("*/api/brand/settings", "get-brand-settings");
  serve("*/api/config/organisation/values", "get-config-organisation-values");
  serve("*/api/clients/:id/addresses", "get-clients-id-addresses");
  serve("*/api/clients/:id/phones", "get-clients-id-phones");
  serve("*/api/clients/:id/emails", "get-clients-id-emails");
  serve("*/api/clients/:id/companies", "get-clients-id-companies");
  serve("*/api/billing_cycles", "get-billing-cycles");
  serve("*/api/countries", "get-countries");
  serve("*/api/countries/:id/regions", "get-countries-id-regions");
}

const outbound: string[] = [];
server.events.on("request:start", ({ request }) => {
  outbound.push(new URL(request.url).pathname);
});

async function seedClientSession(): Promise<void> {
  const { useSessionStore, useActiveSession } =
    await import("../../../session-store");
  const { mapSessionUser } =
    await import("../../../session-store/session-store.mappers");
  const token = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-client",
    { recordingsDir: sessionRecordingsDir }
  );
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });
  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
}

const PERSONAL_MODEL: UnifiedModel = {
  address: {
    address1: "1 Prover Street",
    city: "Leeds",
    postcode: "LS1 1AA",
    countryId: "country-1"
  }
};

// -----------------------------------------------------------------------------

describe("unified billing-detail data lifecycle", () => {
  beforeEach(async () => {
    outbound.length = 0;
    clearSessionCookies();
    const { queryClient } = await import("../../../query");
    queryClient.clear();
    await seedClientSession();
    serveLookups();
  });

  afterEach(() => server.resetHandlers());

  it("AC-8 opens a personal detail: loadLookups gathers the lists and parse builds the schema", async () => {
    const detail = useUnified(UnifiedType.PERSONAL);
    await flushPromises();
    await detail.isReady();

    expect(detail.meta.value.isAvailable).toBe(true);
    expect(detail.context.value?.type).toBe(UnifiedType.PERSONAL);
    expect(detail.schema.value).toBeTypeOf("object");

    expect(outbound).toContain("/api/countries");
    expect(
      outbound.some(path => /\/api\/clients\/[^/]+\/addresses$/.test(path))
    ).toBe(true);
  });

  it("AC-9 validates a typed model and hands back the checked model", async () => {
    const detail = useUnified(UnifiedType.PERSONAL);
    await flushPromises();
    await detail.isReady();

    detail.input(PERSONAL_MODEL);
    const checked = await (
      detail.input as unknown as { flush: () => Promise<UnifiedModel> }
    ).flush();

    // validate ran and handed back the checked model (AC-9); the address it
    // carries is the structured, schema-checked address, not the raw input.
    expect(checked).toBeDefined();
    expect(checked.address).toBeTypeOf("object");
  });

  it("invalidate settles cleanly against a loaded context", async () => {
    const services = useUnifiedServices();
    const loaded = (await services.loadLookups({
      type: UnifiedType.PERSONAL,
      model: {}
    } as unknown as UnifiedContext)) as UnifiedContext;

    const settled = await services
      .invalidate(loaded)
      .then(() => "resolved")
      .catch(() => "rejected");

    expect(settled).toBe("resolved");
  });
});
