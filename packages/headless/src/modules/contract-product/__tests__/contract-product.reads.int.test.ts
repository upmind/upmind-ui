/**
 * @fileoverview useContractProducts — the paged products collection (integration, AC-1)
 *
 * ## Job To Be Done
 * Drive the REAL `useContractProducts()` collection against the RECORDED
 * production list capture (`contract-product.fixtures.ts`,
 * `GET contracts_products?split_count=1&limit=10`) and prove AC-1: a client
 * sees the reactive page of contract products on their own account, each
 * one arriving with its status. `contract-product.mutations.int.test.ts`
 * proves the manager's writes; this file proves the one read the
 * collection owns, which no previously-authored test in this module
 * exercised at all.
 *
 * ## What Breaks If These Fail
 * A client's products page renders empty, or with rows missing the status
 * a client needs to tell an active subscription from a cancelled one — with
 * no integration coverage able to catch it.
 */

import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { useContractProducts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("useContractProducts — I see the products on my own account (AC-1)", () => {
  it("AC-1 the reactive page arrives from the RECORDED production list capture, each row carrying a mapped status", async () => {
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/contracts_products", () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(context.data.value.length).toBeGreaterThan(0);
    });

    expect(meta.hasError.value).toBe(false);
    for (const product of context.data.value) {
      expect(product.id).toBeTruthy();
      expect(product.status?.code).toBeTruthy();
    }
  });
});
