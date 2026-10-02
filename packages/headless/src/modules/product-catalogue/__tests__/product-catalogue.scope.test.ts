// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview product-catalogue — the opt-in scope (FE-3206, AC-28)
 *
 * ## Job To Be Done
 * A contract product's change of plan reads its reachable plans through the
 * REAL `useProductCatalogue`, widened only by the opt-in `scope` (design 8.1,
 * R13, ADR-2, ADR-25). With a scope the instance reads no basket and no
 * category tree, sends each forced filter as a non-empty string, counts with
 * `limit=count` when asked for a count, sends the term 0 as `"0"`, and keys
 * its cache on the contract currency and account. With no scope, each
 * existing consumer sends the request and keeps the cache key it has today.
 *
 * Each answer is the staging recording of that exact request. A request no
 * recording holds fails the test as a capture gap.
 *
 * ## What Breaks If These Fail
 * The change of plan lists plans the client cannot order, loses the one-term
 * filter on a term-0 subscription, reads the basket and the category tree at
 * every product boot, shares a cache entry with the storefront, or every
 * storefront catalogue starts sending the migration filters.
 */

import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { useProductCatalogue } from "..";
import {
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import countRecording from "../../contract-product/__tests__/scenarios/i-am-told-how-many-plans-i-can-change-my-subscription-to/02/get-basket-products-0f60fb24.json";
import { queryClient } from "../../query/client";
import termZeroRecording from "./fixtures/get-basket-products-52a3c58f.json";
import { server } from "./setup.integration";
import { filter, isEqual, map, split } from "lodash-es";
import type { ProductCatalogueScope } from "../product-catalogue.types";

// -----------------------------------------------------------------------------

const OWN_RECORDINGS = join(import.meta.dirname, "fixtures");

/** The owning modules' recordings that answer a storefront boot's reads. */
const OWNER_RECORDINGS = map(
  ["brand", "system", "basket", "product-categories"],
  owner => join(import.meta.dirname, `../../${owner}/__tests__/fixtures`)
);

const COUNT_STEP = join(
  import.meta.dirname,
  "../../contract-product/__tests__/scenarios/i-am-told-how-many-plans-i-can-change-my-subscription-to/02"
);

type Recording = {
  request: { path: string };
  response: { body: { total: number } };
};

const paramsOf = (recording: unknown) =>
  new URL((recording as Recording).request.path, "http://recorded")
    .searchParams;

/** The scope a recorded plan read was asked in: its plans, currency and account. */
const scopeOf = (recording: unknown): ProductCatalogueScope => {
  const params = paramsOf(recording);
  return {
    ids: split(params.get("filter[id]") ?? "", ","),
    currencyId: params.get("currency_id") ?? undefined,
    accountId: params.get("account_id") ?? undefined,
    recurringOnly: true,
    orderable: true,
    categories: false
  };
};

const COUNT = countRecording as unknown as Recording;
const RECORDED_SCOPE = scopeOf(countRecording);

let replay: ReturnType<typeof startScenarioReplay> | undefined;
let sent: ReturnType<typeof observeRequests> | undefined;

afterEach(() => {
  sent?.stop();
  queryClient.clear();
  const gaps = replay?.gaps() ?? [];
  replay = undefined;
  expect(gaps).toStrictEqual([]);
});

/** A signed-in client; only the recordings armed after it answer. */
async function signedIn(...steps: string[]): Promise<void> {
  replay = startScenarioReplay(server);
  await seedClientSession(server, { withBrandConfig: false });
  for (const step of steps) replayStep(server, step);
  sent = observeRequests(server, "/api/");
}

const isPlanRead = ({ url }: { url: string }) =>
  new URL(url).pathname.endsWith("/basket/products");

const catalogueKeys = () =>
  map(
    filter(queryClient.getQueryCache().getAll(), query =>
      isEqual(query.queryKey.slice(0, 2), ["product", "catalogue"])
    ),
    "queryKey"
  );

// -----------------------------------------------------------------------------

describe("AC-28 — the scope instance", () => {
  it("reads no category tree, no basket and no basket currency at setup", async () => {
    await signedIn();

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true, enabled: ref(false) }
    });
    await catalogue.isReady();
    await new Promise(resolve => setTimeout(resolve));

    expect(sent?.all()).toStrictEqual([]);
  });

  it("counts with limit=count and each forced filter, in the contract currency and account, with no page and no basket", async () => {
    await signedIn(COUNT_STEP);

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true }
    });

    await vi.waitFor(() =>
      expect(catalogue.pagination.value.total).toBe(COUNT.response.body.total)
    );
    const [count, ...more] = filter(sent?.all(), isPlanRead);
    const params = new URL(count.url).searchParams;
    expect(more).toStrictEqual([]);
    expect(params.get("limit")).toBe("count");
    expect(params.get("offset")).toBeNull();
    expect(params.get("basket_id")).toBeNull();
    expect(params.get("currency_code")).toBeNull();
    expect(params.get("currency_id")).toBe(RECORDED_SCOPE.currencyId);
    expect(params.get("account_id")).toBe(RECORDED_SCOPE.accountId);
    expect(params.get("filter[id]")).toBe(
      paramsOf(countRecording).get("filter[id]")
    );
    expect(params.get("filter[billing_cycle_months|neq]")).toBe("0");
    expect(params.get("filter[available_for_sales]")).toBe("1");
    expect(params.get("filter[clients_can_order]")).toBe("1");
    expect(sent?.all()).toHaveLength(1);
  });

  it("keys its cache on the contract currency and account", async () => {
    await signedIn(COUNT_STEP);

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true }
    });
    await vi.waitFor(() =>
      expect(catalogue.pagination.value.total).toBe(COUNT.response.body.total)
    );

    const [key, ...more] = catalogueKeys();
    expect(more).toStrictEqual([]);
    expect(JSON.stringify(key)).toContain(RECORDED_SCOPE.currencyId);
    expect(JSON.stringify(key)).toContain(RECORDED_SCOPE.accountId);
  });

  it('asks for the plans of a term-0 subscription on the term 0, sent as "0"', async () => {
    await signedIn(OWN_RECORDINGS);

    const catalogue = useProductCatalogue({
      infinite: true,
      pagination: { limit: 4, offset: 0 },
      scope: {
        ...scopeOf(termZeroRecording),
        recurringOnly: false,
        billingCycleMonths: 0
      }
    });

    await vi.waitFor(() =>
      expect(filter(sent?.all(), isPlanRead)).not.toStrictEqual([])
    );
    await catalogue.isReady();
    const [list] = filter(sent?.all(), isPlanRead);
    expect(
      new URL(list.url).searchParams.get("filter[prices.billing_cycle_months]")
    ).toBe("0");
  });

  it("sends none of the scope's filters or sidecars, and keys no currency or account, when no scope is given", async () => {
    await signedIn(...OWNER_RECORDINGS, OWN_RECORDINGS);

    const catalogue = useProductCatalogue();

    await vi.waitFor(() =>
      expect(filter(sent?.all(), isPlanRead)).not.toStrictEqual([])
    );
    await catalogue.isReady();
    const [list] = filter(sent?.all(), isPlanRead);
    const params = new URL(list.url).searchParams;
    for (const key of [
      "filter[id]",
      "filter[prices.billing_cycle_months]",
      "filter[billing_cycle_months|neq]",
      "filter[available_for_sales]",
      "filter[clients_can_order]",
      "account_id",
      "currency_id"
    ])
      expect(params.get(key), key).toBeNull();
    expect(params.get("limit")).not.toBe("count");
    expect(JSON.stringify(catalogueKeys())).not.toContain("accountId");
  });
});
