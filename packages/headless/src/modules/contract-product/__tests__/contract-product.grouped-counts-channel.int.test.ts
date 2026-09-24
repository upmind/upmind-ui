/**
 * @fileoverview useContractProducts — the grouped counts a page reads off the
 * collection context (integration, AC-19)
 *
 * ## Job To Be Done
 * Prove that the grouped counts a client asks for land on
 * `useContractProducts().useContext().groupedCounts`, the channel a labs or
 * portal page draws them from, and that a second ask replaces the held
 * entries. Every body is the module's recorded grouped-counts capture.
 *
 * ## What Breaks If These Fail
 * The products page asks for the grouped counts and shows nothing, because
 * the rows live only in the answer to the action; or each refresh stacks a
 * second copy of every category onto the dashboard.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { useContractProducts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

function installGroupedHandlers(): { groupedReads: () => number } {
  let groupedReads = 0;
  server?.use(
    http.get("*/contracts_products", () =>
      HttpResponse.json(recorded.list(), { status: 200 })
    ),
    http.get("*/clients/:clientId/contracts/products", () => {
      groupedReads += 1;
      return HttpResponse.json(recorded.groupedCounts(), { status: 200 });
    })
  );
  return { groupedReads: () => groupedReads };
}

async function openCollection() {
  await seedClientSession();
  installBackgroundStubs();
  const handlers = installGroupedHandlers();
  const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  return { collection, ...handlers };
}

describe("useContractProducts — the grouped counts I asked for are kept for my page to show (AC-19)", () => {
  it("AC-19 after I ask for my grouped counts, the collection context holds the recorded entries, one per category with its count", async () => {
    const { collection } = await openCollection();
    const recordedRows = recorded.groupedCounts().total;
    expect(recordedRows.length).toBeGreaterThan(0);

    await collection.useActions().loadGroupedCounts();

    expect(collection.useContext().groupedCounts.value).toEqual(recordedRows);
  });

  it("AC-19 asking for my grouped counts again replaces the held entries — one per category, never a second copy", async () => {
    const { collection, groupedReads } = await openCollection();
    const recordedRows = recorded.groupedCounts().total;

    await collection.useActions().loadGroupedCounts();
    await collection.useActions().loadGroupedCounts();

    expect(groupedReads()).toBe(2);
    expect(collection.useContext().groupedCounts.value).toHaveLength(
      recordedRows.length
    );
    expect(collection.useContext().groupedCounts.value).toEqual(recordedRows);
  });
});
