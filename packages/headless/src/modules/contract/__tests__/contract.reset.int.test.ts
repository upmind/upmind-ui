/**
 * @fileoverview useContract — reset() drops the module cache and redials
 *
 * ## Job To Be Done
 * Drive the REAL `useContract()` manager against the RECORDED single-contract
 * capture (`contract.fixtures.ts`) and prove reset()'s cache-drop contract: a
 * loaded manager holds a module query-cache entry for its record; `reset()`
 * REMOVES that entry (its query data becomes undefined) and re-drives the
 * machine through REFRESH, so the record read goes out again on the wire and
 * the manager re-settles on its status node publishing the record. The wire
 * count alone cannot tell reset from a no-op (the record read is never stale-
 * cached, so REFRESH always refetches); the dropped cache entry is what proves
 * the cache was actually cleared.
 *
 * ## What Breaks If These Fail
 * The force-handle redial leaves the module's cached read in place: a consumer
 * calls `reset()` expecting the cache dropped, but a sibling reader of the same
 * key is still served the stale cached record — with no integration coverage
 * able to catch it.
 */

import { describe, expect, it } from "vitest";
import { useContract } from "..";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installContractHandler,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The module's own query-cache entry for one contract record, keyed under the
 * module root by record id — the entry `reset()` must drop. */
function recordCacheData(id: string): unknown {
  const entry = queryClient
    .getQueryCache()
    .getAll()
    .find(query => {
      const key = query.queryKey as unknown[];
      return key[0] === "contracts" && key[1] === id;
    });
  return entry?.state.data;
}

describe("useContract — reset() drops the module cache before it redials", () => {
  it("removes the record's module cache entry and re-settles the manager on its status node with the record", async () => {
    await seedClientSession();
    const row = recorded.one().data as { id: string; status: { code: string } };
    const handler = installContractHandler(server);

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
    await manager.useActions().isReady();
    const readsAfterOpen = handler.reads();
    expect(readsAfterOpen).toBeGreaterThan(0);
    expect(recordCacheData(row.id)).toBeDefined();

    await manager.useActions().reset();
    expect(recordCacheData(row.id)).toBeUndefined();

    await manager.useActions().isReady();
    expect(handler.reads()).toBeGreaterThan(readsAfterOpen);
    expect(manager.useContext().contract.value?.id).toBe(row.id);
    expect(manager.useContext().contract.value?.status.code).toBe(
      row.status.code
    );
  });
});
