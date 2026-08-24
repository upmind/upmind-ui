// -----------------------------------------------------------------------------
/**
 * @fileoverview a declared sort reaches the wire (integration, AC-42 — FE-3103 D3)
 *
 * ## Job To Be Done
 * `useQuerySchema()` declares `sort.field` as `name` | `created_at`, proven at
 * the SCHEMA layer in `client-address.query-schema.int.test.ts`. This proves
 * the other half of AC-42's capability — that calling
 * `useActions().sortBy(intent)` actually drives that declaration onto the
 * wire's `order` param, ascending and descending, and that a field the schema
 * does not declare is unspellable: it never reaches the wire at all.
 *
 * Negative control: `client-address.sort.must-fail.patch` reduces `sortBy` to
 * `query.setCriteria({})` — a pure no-op — and must flip the ascending
 * assertion below RED.
 *
 * ## What Breaks If These Fail
 * `sortBy` becomes cosmetic: a caller names a sort and the wire keeps
 * answering in whatever order it always did, or an unspellable column leaks
 * through and the API 500s on a filter it does not recognise.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressesListHandler,
  observeAddressRequests,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import { some } from "lodash-es";
import type { SortModel } from "../client-address.types";

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

describe("client-address — a declared sort reaches the wire (AC-42)", () => {
  it("AC-42 sortBy ascending name asks the wire for order=name", async () => {
    const addresses = await bootCollection();
    const observed = observeAddressRequests();

    addresses.useActions().sortBy([{ field: "name", dir: SortDirection.ASC }]);

    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request => new URL(request.url).searchParams.get("order") === "name"
        )
      ).toBe(true)
    );
    observed.stop();
  });

  it("AC-42 sortBy descending name asks the wire for order=-name", async () => {
    const addresses = await bootCollection();
    const observed = observeAddressRequests();

    addresses.useActions().sortBy([{ field: "name", dir: SortDirection.DESC }]);

    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request => new URL(request.url).searchParams.get("order") === "-name"
        )
      ).toBe(true)
    );
    observed.stop();
  });

  it("AC-42 sortBy created_at asks the wire for order=created_at", async () => {
    const addresses = await bootCollection();
    const observed = observeAddressRequests();

    addresses
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.ASC }]);

    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request =>
            new URL(request.url).searchParams.get("order") === "created_at"
        )
      ).toBe(true)
    );
    observed.stop();
  });

  it("AC-42 cannot spell a sort column the schema does not declare — ajv rejects the write, the model stays put", async () => {
    const addresses = await bootCollection();
    const before = addresses.useContext().query.value.sort;

    addresses
      .useActions()
      .sortBy([
        { field: "town", dir: SortDirection.ASC }
      ] as unknown as SortModel);

    await vi.waitFor(() =>
      expect(addresses.useContext().error.value).toBeDefined()
    );
    expect(addresses.useContext().query.value.sort).toEqual(before);
  });
});
