// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — a same-column two-direction sort write is refused (AC-36, AC-39)
 *
 * ## Job To Be Done
 * `uniqueItems` alone de-dupes ajv array ENTRIES, not FIELDS: two `created_at`
 * rows with opposite `dir` are two distinct entries, so `uniqueItems` never
 * catches them, and the declared `field` enum names exactly one legal
 * column — a second entry can only ever contradict the first, never name a
 * second column. `maxItems: 1` on the `sort` branch (`client-phone.schemas.ts`)
 * is what actually closes this: it caps the array at one entry regardless of
 * whether the entries are distinct.
 *
 * ## What Breaks If This Fails
 * Without the cap, a two-entry sort write reaches the wire as
 * `order=created_at,-created_at` — a self-contradicting order the server has
 * no defined behaviour for — instead of being refused before it is sent.
 */

import { describe, expect, it } from "vitest";
import { useClientPhones } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query/query.types";
import {
  installPhonesHandler,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

async function bootCollection(): Promise<ReturnType<typeof useClientPhones>> {
  const { clientId } = await seedClientSession();
  installPhonesHandler(server, clientId);
  const phones = useClientPhones();
  await phones.useActions().isReady();
  return phones;
}

// -----------------------------------------------------------------------------

describe("client-phone — a same-column two-direction sort write is refused (AC-36, AC-39)", () => {
  it("never reaches the wire as order=created_at,-created_at and leaves the last committed order standing", async () => {
    const phones = await bootCollection();
    const observed = observeRequests(server, "/phones");

    phones.useActions().sortBy([
      { field: "created_at", dir: SortDirection.ASC },
      { field: "created_at", dir: SortDirection.DESC }
    ]);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    const orderParams = observed
      .all()
      .map(request => new URL(request.url).searchParams.get("order"));

    expect(orderParams).not.toContain("created_at,-created_at");
    expect(phones.useContext().query.value.sort).toEqual([
      { field: "created_at", dir: SortDirection.ASC }
    ]);
  });
});
