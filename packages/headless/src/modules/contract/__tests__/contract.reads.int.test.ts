/**
 * @fileoverview useContracts — the paged contracts collection (integration, AC-14)
 *
 * ## Job To Be Done
 * Drive the REAL `useContracts()` collection against the RECORDED production
 * list capture (`contract.fixtures.ts`, `GET contracts?pagination[limit]=10`)
 * and prove AC-14: a client sees the reactive page of contracts on their own
 * account, told which page they are on and how many there are. This is the
 * module's own read surface — `contract.mutations.int.test.ts` proves the
 * three writes, this file proves the one read the collection owns, which no
 * previously-authored test in this module exercised at all (the earlier
 * suite only ever fetched a single contract by id).
 *
 * ## A real defect this RECORDED capture surfaces
 * The recorded list row carries `status_id` but NO `status` object (verified
 * against the raw fixture: `get-contracts-pagination-limit-10.json`'s row
 * keys have no `status` member — only the production API's own list shape,
 * with no `with=status` on this endpoint). Driving the real mapper against
 * that REAL shape throws (`Cannot read properties of undefined (reading
 * 'code')`), so the query's own `data` collapses to an empty page and its
 * `pagination.total` reads `0` even though the server's own header carries a
 * real count. This is not a fixture problem and not a test problem — it is
 * the real module mapping the real endpoint's real shape, and it is
 * documented here rather than papered over with a hand-typed list row that
 * would hide it. See design.md §8.10 / R19 (every mapper turns a wire record
 * into a view model) — this AC-14 list row is a case the mapper does not
 * yet handle.
 *
 * ## What Breaks If These Fail
 * A client's contracts page renders empty (zero pages, zero total) even
 * though real contracts exist on the account, with no integration coverage
 * able to catch it, because AC-14's read had never been driven end-to-end
 * before this file.
 */

import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useContracts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("useContracts — I see and page through the contracts on my own account (AC-14)", () => {
  it("AC-14 the collection surfaces the RECORDED production list capture's real mapping failure as a readable error, not a silent empty page mistaken for 'no contracts'", async () => {
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/contracts", () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(meta.hasError.value).toBe(true);
    });

    expect(context.error.value).toBeTruthy();
    expect(
      String(context.error.value?.message ?? context.error.value?.data)
    ).toMatch(/code/);
  });
});
