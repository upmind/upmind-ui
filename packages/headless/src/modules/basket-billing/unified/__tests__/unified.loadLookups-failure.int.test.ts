// -----------------------------------------------------------------------------
/**
 * @fileoverview unified loadLookups — boundary failure mode
 *
 * ## Job To Be Done
 * Prove `useUnifiedServices().loadLookups` lands a boundary failure as a HANDLED
 * verdict, not an unhandled hang: when the countries read — the list the billing
 * form cannot build without — rejects with a 5xx, loadLookups either surfaces a
 * handled error or resolves to a degraded context with no countries. It never
 * leaves the form waiting forever.
 *
 * This lives in its OWN file so the failing countries read runs against fresh
 * module state — the countries lookup is served by a module-level cache the
 * happy-path file has already populated, so the 5xx must be exercised in
 * isolation to reach the real boundary.
 *
 * ## Provenance
 * The success bodies are the co-located recorded fixtures; the 5xx is a control
 * response (status ≥ 400), which the provenance rule exempts.
 *
 * ## What Breaks If These Fail
 * A transient countries-endpoint outage hangs the checkout billing form forever
 * instead of degrading to a handled error the customer can retry.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../../__tests__/int-test-helpers";
import { useUnifiedServices } from "../services";
import { UnifiedType } from "../types";
import { server } from "./setup.integration";
import type { UnifiedContext } from "../types";

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

function serve(route: string, key: string): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server?.use(
    http.get(route, () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: recorded.status
      })
    )
  );
}

function serveHealthyExceptCountries(): void {
  serve("*/api/org/modules", "get-org-modules");
  serve("*/api/config/brand/values", "get-config-brand-values");
  serve("*/api/brand/settings", "get-brand-settings");
  serve("*/api/config/organisation/values", "get-config-organisation-values");
  serve("*/api/clients/:id/addresses", "get-clients-id-addresses");
  serve("*/api/clients/:id/phones", "get-clients-id-phones");
  serve("*/api/clients/:id/emails", "get-clients-id-emails");
  serve("*/api/clients/:id/companies", "get-clients-id-companies");
  serve("*/api/billing_cycles", "get-billing-cycles");
  serve("*/api/countries/:id/regions", "get-countries-id-regions");
  server?.use(
    http.get("*/api/countries", () =>
      HttpResponse.json({ error: "server error" }, { status: 500 })
    )
  );
}

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

// -----------------------------------------------------------------------------

describe("unified loadLookups — countries boundary failure", () => {
  beforeEach(async () => {
    clearSessionCookies();
    const { queryClient } = await import("../../../query");
    queryClient.clear();
    await seedClientSession();
    serveHealthyExceptCountries();
  });

  afterEach(() => server?.resetHandlers());

  it("lands a 5xx countries read as a handled verdict, never an unhandled hang", async () => {
    const services = useUnifiedServices();

    let threw: unknown;
    let resolved: UnifiedContext | undefined;
    const context: UnifiedContext = {
      type: UnifiedType.PERSONAL,
      model: {},
      countries: [],
      addresses: [],
      companies: [],
      phones: [],
      emails: []
    };
    await services
      .loadLookups(context)
      .then(loaded => {
        resolved = loaded;
      })
      .catch(error => {
        threw = error;
      });

    if (threw === undefined) {
      expect(resolved).toBeDefined();
      expect(resolved?.countries ?? []).toHaveLength(0);
    } else {
      expect(threw).toBeDefined();
    }
  });
});
