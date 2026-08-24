// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — meta publishes isFiltered (AC-36)
 *
 * ## Job To Be Done
 * `useClientCompanies.meta.ts` hands `isFiltered` straight through from
 * `query.isFiltered` — never a second, re-derived copy of the expression — so
 * an empty list can say it is empty BECAUSE it is filtered. AC-36 names
 * `useMeta()` specifically: the flat criteria-handle `isFiltered` proven in
 * `client-company.criteria.int.test.ts` is a different member on a different
 * layer, and does not itself prove this one.
 *
 * ## What Breaks If These Fail
 * A filtered-but-empty list reads as "no companies at all" rather than "no
 * companies match", which is the wrong message for the same state.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientCompanies } from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installCompaniesSearchHandler,
  RECORDED_NAME_NEEDLE,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-company — meta publishes isFiltered (AC-36)", () => {
  it("AC-36 hands isFiltered straight through from the query's criteria on useMeta()", async () => {
    const { clientId } = await seedClientSession();
    installCompaniesSearchHandler(server, clientId);
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    expect(companies.useMeta().isFiltered.value).toBe(false);

    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });

    await vi.waitFor(() =>
      expect(companies.useMeta().isFiltered.value).toBe(true)
    );
  });

  it("AC-36 falls back to false once the filter set is emptied again", async () => {
    const { clientId } = await seedClientSession();
    installCompaniesSearchHandler(server, clientId);
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    companies.useActions().filterBy({ name: { like: RECORDED_NAME_NEEDLE } });
    await vi.waitFor(() =>
      expect(companies.useMeta().isFiltered.value).toBe(true)
    );

    companies.useActions().filterBy({});

    await vi.waitFor(() =>
      expect(companies.useMeta().isFiltered.value).toBe(false)
    );
  });

  it("AC-36 a sort alone never counts as filtered — the declared default would make it meaningless", async () => {
    const { clientId } = await seedClientSession();
    installCompaniesSearchHandler(server, clientId);
    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();

    companies.useActions().sortBy([{ field: "name", dir: SortDirection.ASC }]);

    await vi.waitFor(() =>
      expect(companies.useContext().query.value.sort).toEqual([
        { field: "name", dir: SortDirection.ASC }
      ])
    );
    expect(companies.useMeta().isFiltered.value).toBe(false);
  });
});
