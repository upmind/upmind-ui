/**
 * @fileoverview useContracts — the paged contracts collection (integration, AC-14)
 *
 * ## Job To Be Done
 * Drive the REAL `useContracts()` collection against the RECORDED production
 * list capture (`contract.fixtures.ts`, `GET contracts?pagination[limit]=10`)
 * and prove AC-14 exactly as `contract.feature` states it: a client sees the
 * reactive page of contracts on their own account, and is given the first
 * page, told which page they are on and how many there are, and can move
 * forward and back. `contract.mutations.int.test.ts` proves the three
 * writes; this file proves the one read the collection owns.
 *
 * ## What Breaks If These Fail
 * A client's contracts page renders empty, or with no page/count
 * information, even though real contracts exist on the account — with no
 * integration coverage able to catch it.
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
  it("AC-14 the reactive first page arrives from the RECORDED production list capture, told which page I am on, how many there are, and that a next page exists", async () => {
    const captured = recorded.list();
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/contracts", () =>
        HttpResponse.json(captured, { status: 200 })
      )
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(context.data.value.length).toBeGreaterThan(0);
    });

    expect(meta.hasError.value).toBe(false);
    expect(context.data.value.length).toBe(captured.data.length);
    for (const contract of context.data.value) {
      expect(contract.id).toBeTruthy();
    }

    expect(context.pagination.value.page).toBe(1);
    expect(context.pagination.value.total).toBe(captured.total);
    expect(meta.hasNextPage.value).toBe(true);
    expect(meta.hasPrevPage.value).toBe(false);
  });
});
