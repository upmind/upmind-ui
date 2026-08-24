// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — ordering the collection (AC-36)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhones()` through `sortBy` against MSW-replayed
 * staging recordings of the SAME account in both real orders: proving the
 * request re-issues with the new `order=<±field>` key, that the rows the
 * collection then holds are the ones the API actually returned in that
 * order, that clearing the order returns to the schema's declared default,
 * and that an undeclared sort field is refused before it ever reaches the
 * wire — the last order that DID commit stays standing.
 *
 * ## The recorded evidence behind it
 * `pnpm fixtures:generate client-phone` captured the same account's
 * collection twice: `…-case-sort-desc.json` (`order=-created_at`) and
 * `…-case-sort-asc.json` (`order=created_at`). Their row `created_at` values
 * are genuinely monotonic in opposite directions — real server-side
 * reordering, never a client-side re-sort of one fixture.
 *
 * ## What Breaks If These Fail
 * A consumer asks to see the newest number first and silently keeps seeing
 * whatever order the server felt like returning — or a typo'd sort field
 *500s the whole collection instead of being refused up front.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientPhones } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query/query.types";
import {
  installSortedPhonesHandler,
  recorded,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

async function bootCollection(): Promise<ReturnType<typeof useClientPhones>> {
  const { clientId } = await seedClientSession();
  installSortedPhonesHandler(server, clientId);
  const phones = useClientPhones();
  await phones.useActions().isReady();
  return phones;
}

const rowIds = (phones: ReturnType<typeof useClientPhones>): string[] =>
  phones.useContext().data.value.map(phone => phone.id);

// -----------------------------------------------------------------------------

describe("client-phone — order my phone numbers (AC-36)", () => {
  it("leaves as order=-created_at on the wire and holds the real descending rows", async () => {
    const phones = await bootCollection();
    const observed = observeRequests(server, "/phones");

    phones
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.DESC }]);

    await vi.waitFor(() =>
      expect(observed.lastParam("order")).toBe("-created_at")
    );
    const expectedDesc = recorded.sortDesc().data.map(row => row.id);
    await vi.waitFor(() => expect(rowIds(phones)).toEqual(expectedDesc));
    observed.stop();
  });

  it("leaves as order=created_at on the wire and holds the real ascending rows when reversed", async () => {
    const phones = await bootCollection();
    const observed = observeRequests(server, "/phones");

    // Move off the schema's own ASC default first, so the reversal back to
    // ASC below is a genuine criteria change the query platform re-fetches
    // for — not a no-op against the boot state it already holds. `observed`
    // is listening from BEFORE this first change, so `lastParam` below
    // correctly reflects whichever request landed most recently.
    phones
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.DESC }]);
    await vi.waitFor(() =>
      expect(observed.lastParam("order")).toBe("-created_at")
    );

    // Ascending + created_at IS the schema's own declared default, so this
    // combination is the SAME queryKey the boot fetch already cached — the
    // cache law (proven elsewhere) means setting it again alone would be
    // served from cache, not re-fetched. `invalidate()` is the documented,
    // consumer-facing way to force a fresh read of a combination already
    // held (AC-10), so the wire proof below is genuine, not a cache hit.
    phones
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.ASC }]);
    await phones.useActions().invalidate();
    await vi.waitFor(() =>
      expect(observed.lastParam("order")).toBe("created_at")
    );
    const expectedAsc = recorded.sortAsc().data.map(row => row.id);
    await vi.waitFor(() => expect(rowIds(phones)).toEqual(expectedAsc));
    observed.stop();
  });

  it("clearing the order returns the published criteria to the schema's declared default", async () => {
    const phones = await bootCollection();

    phones
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.DESC }]);
    await vi.waitFor(() =>
      expect(phones.useContext().query.value.sort).toEqual([
        { field: "created_at", dir: SortDirection.DESC }
      ])
    );

    phones.useActions().sortBy([]);
    await vi.waitFor(() =>
      expect(phones.useContext().query.value.sort).toEqual([
        { field: "created_at", dir: SortDirection.ASC }
      ])
    );
  });

  it("refuses an undeclared sort field before it reaches the wire — the last committed order stays standing", async () => {
    const { clientId } = await seedClientSession();
    installSortedPhonesHandler(server, clientId);
    const observed = observeRequests(server, "/phones");

    const phones = useClientPhones();
    await phones.useActions().isReady();
    await vi.waitFor(() =>
      expect(observed.lastParam("order")).toBe("created_at")
    );

    phones.useActions().sortBy([{ field: "id", dir: SortDirection.ASC }]);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.lastParam("order")).toBe("created_at");
    expect(phones.useContext().query.value.sort).toEqual([
      { field: "created_at", dir: SortDirection.ASC }
    ]);
  });
});
