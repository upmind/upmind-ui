// -----------------------------------------------------------------------------
/**
 * @fileoverview `useContext().query`, `useMeta().isFiltered` and the
 * criteria door's own guard rails are published (integration, AC-8/AC-35/
 * AC-41/AC-43)
 *
 * ## Job To Be Done
 * The deleted `client-address.criteria.int.test.ts` asserted the handle
 * publishes `criteria` / `isFiltered` / `criteriaError` / `setCriteria`, has
 * no raw `sort()`/`filter()` setter beside the criteria door, cannot spell an
 * undeclared filter column onto the wire, surfaces ajv's verdict on a
 * badly-typed write, and issues exactly one request per distinct criteria
 * combination. Re-homed below, read off the LIVE returned object (never off
 * source): this module's `useContext()` today publishes `query` (the active
 * criteria, renamed from the old `criteria`); `isFiltered` moved to
 * `useMeta()` — empirically probed, never off source, since a concurrent
 * edit relocated it off `useContext()` while this story was in flight.
 * `setCriteria` is published too, but on `useActions()`, not `useContext()`
 * — `pager-writes-through-criteria.int.test.ts` proves it drives a real page
 * window; `criteriaError` is not a separate published member — a criteria
 * write ajv rejects is captured on the shared `useContext().error` instead
 * (probed below, AC-41).
 *
 * ## What Breaks If These Fail
 * A filter bar or a url-rehydration consumer reading `useContext().query` for
 * the active state, or `useMeta().isFiltered` for a "clear search"
 * affordance, would be reading a value that never moves — the write actions
 * could keep working on the wire while every published READ of them
 * silently stops. A raw setter beside the criteria door would let a consumer
 * reach past the declared schema (AC-35); an undeclared filter column
 * reaching the wire is the FE-2824 shape for AC-41's filter bar; a
 * badly-typed write landing silently, with no captured error, hides ajv's
 * rejection from every consumer that reads `useContext().error` for it; and a
 * cache that does not hold re-issues a request for a combination already on
 * hand, silently multiplying wire traffic.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { distinctCombinations } from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressesListHandler,
  observeAddressRequests,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import { filter, flatMap, some } from "lodash-es";
import type { QueryModel } from "../client-address.types";

// -----------------------------------------------------------------------------

/**
 * The RESOLVED scoped instance `.as(CLIENT)` actually returns — not
 * `ReturnType<typeof useClientAddresses>`, which is the un-resolved
 * `ScopeBuilder` one level up the chain and carries neither `useActions` nor
 * `useContext`.
 */
type ClientAddressesInstance = ReturnType<
  ReturnType<typeof useClientAddresses>["as"]
>;

async function bootCollection(): Promise<ClientAddressesInstance> {
  const { clientId } = await seedClientSession();
  const { primary, secondary } = recordedRows();
  installAddressesListHandler(server, clientId, [primary, secondary]);
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await addresses.useActions().isReady();
  return addresses;
}

// -----------------------------------------------------------------------------

describe("client-address — useContext().query publishes the active criteria (AC-43)", () => {
  it("AC-43 mirrors the schema's own declared boot defaults, not a value read off code", async () => {
    const addresses = await bootCollection();

    const pagination = addresses.useContext().schemas.query.schema.properties
      ?.pagination as { properties?: { limit?: { default?: unknown } } };
    const declaredLimit = pagination.properties?.limit?.default;
    expect(declaredLimit).toBeDefined();

    expect(addresses.useContext().query.value).toMatchObject({
      pagination: { limit: declaredLimit }
    });
    expect(addresses.useContext().query.value.sort).toBeUndefined();
  });

  it("AC-43 tracks a sortBy write", async () => {
    const addresses = await bootCollection();

    addresses.useActions().sortBy([{ field: "name", dir: SortDirection.ASC }]);

    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.sort).toEqual([
        { field: "name", dir: "asc" }
      ])
    );
  });
});

describe("client-address — useMeta().isFiltered tracks a live filter (AC-8)", () => {
  it("AC-8 is false on boot and true once a search is applied, back to false once cleared", async () => {
    const addresses = await bootCollection();

    expect(addresses.useMeta().isFiltered.value).toBe(false);

    await addresses.useActions().filters.query("London");
    await vi.waitFor(() =>
      expect(addresses.useMeta().isFiltered.value).toBe(true)
    );
    expect(addresses.useContext().query.value.filters).toEqual({
      name: { like: "London" }
    });

    await addresses.useActions().filters.query("");
    await vi.waitFor(() =>
      expect(addresses.useMeta().isFiltered.value).toBe(false)
    );
  });
});

describe("client-address — no raw sort()/filter() setter beside the criteria door (AC-35)", () => {
  it("AC-35 useActions() has no raw sort or filter method — only setCriteria, sortBy and filters.query", async () => {
    const addresses = await bootCollection();
    const actions = addresses.useActions();

    expect(actions).not.toHaveProperty("sort");
    expect(actions).not.toHaveProperty("filter");
    expect(typeof actions.setCriteria).toBe("function");
    expect(typeof actions.sortBy).toBe("function");
    expect(typeof actions.filters.query).toBe("function");
  });
});

describe("client-address — the criteria door rejects what the schema does not declare (AC-41)", () => {
  it("AC-41 cannot spell a filter column the schema does not declare — the declared column beside it still lands, the undeclared one never reaches the wire", async () => {
    const addresses = await bootCollection();
    const observed = observeAddressRequests();

    // A mixed write — one DECLARED column, one the schema does not carry —
    // is the discriminator a wire-silence-only assertion is not: a neutered
    // `setCriteria` that drops every write (the pager-setCriteria-door
    // mutant) would leave `name.like` unset too, exactly like this control's
    // OWN declared subject would under a no-op. Requiring the declared half
    // to land is what tells "the door validated and stripped one column"
    // apart from "the door does nothing at all".
    addresses.useActions().setCriteria({
      filters: { name: { like: "London" }, town: { like: "X" } }
    } as unknown as Partial<QueryModel>);

    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.filters).toEqual({
        name: { like: "London" }
      })
    );

    observed.stop();
    expect(
      filter(
        flatMap(observed.all(), request => [
          ...new URL(request.url).searchParams.keys()
        ]),
        key => key.startsWith("filter[town")
      )
    ).toEqual([]);
  });

  it("AC-41 surfaces ajv's verdict on useContext().error when a declared column is written the wrong type", async () => {
    const addresses = await bootCollection();

    addresses.useActions().setCriteria({
      filters: { name: { like: 123 } }
    } as unknown as Partial<QueryModel>);

    await vi.waitFor(() =>
      expect(addresses.useContext().error.value).toBeDefined()
    );
    expect(addresses.useContext().query.value.filters).toBeUndefined();

    addresses
      .useActions()
      .setCriteria({ filters: { name: { like: "London" } } });

    await vi.waitFor(() =>
      expect(addresses.useContext().error.value).toBeUndefined()
    );
  });
});

describe("client-address — the cache law", () => {
  it("issues exactly one request per DISTINCT criteria combination", async () => {
    const addresses = await bootCollection();
    const observed = observeAddressRequests();

    addresses
      .useActions()
      .setCriteria({ filters: { name: { like: "London" } } });
    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request =>
            new URL(request.url).searchParams.get("filter[name|like]") ===
            "%London%"
        )
      ).toBe(true)
    );

    addresses.useActions().setCriteria({ filters: {} });
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.filters).toBeUndefined()
    );

    addresses
      .useActions()
      .setCriteria({ filters: { name: { like: "London" } } });
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.filters).toEqual({
        name: { like: "London" }
      })
    );
    // Proving a cache HIT is proving an absence — no observable state change
    // to wait on — so this settles on a bounded window rather than a
    // condition, mirroring the deleted original's own technique.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().length).toBe(
      distinctCombinations(observed.all()).length
    );
  });
});

describe("client-address — useMeta().hasError tracks the criteria door's ajv rejection (AC-41)", () => {
  it("AC-41 hasError is false on boot, true once an out-of-range criteria write is rejected, false again once corrected", async () => {
    const addresses = await bootCollection();
    expect(addresses.useMeta().hasError.value).toBe(false);

    addresses.useActions().setCriteria({ pagination: { limit: -1 } });

    await vi.waitFor(() =>
      expect(addresses.useMeta().hasError.value).toBe(true)
    );
    expect(addresses.useContext().error.value).toBeDefined();

    addresses.useActions().setCriteria({ pagination: { limit: 2 } });

    await vi.waitFor(() =>
      expect(addresses.useMeta().hasError.value).toBe(false)
    );
    expect(addresses.useContext().error.value).toBeUndefined();
  });
});
