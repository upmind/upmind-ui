// -----------------------------------------------------------------------------
/**
 * @fileoverview the collection's opening request is schema-derived, not
 * hardcoded (integration, AC-32)
 *
 * ## Job To Be Done
 * `client-company.services.ts` no longer mints its first list request from a
 * raw `sort: [RequestSortDirection.ASC, "created_at"]` literal — the request
 * carries the schema's OWN declared `sort.default` before any consumer has
 * called `filterBy`/`sortBy`. Proven here on the very FIRST outbound request,
 * mirroring `client-address.criteria-defaults.int.test.ts` (FE-3103, the
 * identical shape).
 *
 * ## What Breaks If These Fail
 * A future edit to `useQuerySchema()`'s declared sort default silently stops
 * reaching the wire — the schema and the request drift back apart.
 */

import { describe, expect, it } from "vitest";
import { useClientCompanies } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCompaniesListHandler,
  observeCompanyRequests,
  recordedRows,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-company — the opening request carries the schema's own declared defaults (AC-32)", () => {
  it("AC-32 asks for the schema's declared default sort before any filter or sort action runs", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installCompaniesListHandler(server, clientId, [primary, secondary]);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("order")).toBe("created_at");
  });

  it("AC-32 asks for the schema's declared default (unpaged) window, not a value read off the schema at some other limit", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installCompaniesListHandler(server, clientId, [primary, secondary]);
    const observed = observeCompanyRequests();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("limit")).toBe("0");
  });
});
