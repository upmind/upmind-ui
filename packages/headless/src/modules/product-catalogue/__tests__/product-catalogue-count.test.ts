// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview product-catalogue loadCount — the rows-less count handle
 *
 * ## Job To Be Done
 * `countOnly` returns a count handle, not a list: the envelope `total` on
 * `pagination`, no rows on `data`, a cache key marked `count` so it never shares
 * an entry with the paged read, pagers that move nothing, and a request that
 * fires only once the `enabled` gate opens. Each answer is the staging recording
 * of that exact `limit=count` request.
 *
 * ## What Breaks If These Fail
 * A "how many plans can I change to" badge shares a cache entry with the paged
 * catalogue and reads the wrong number; or shows a Next control that does
 * nothing; or counts behind a closed gate before the contract currency resolves.
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
import { server } from "./setup.integration";
import { filter, isEqual, map, some } from "lodash-es";
import type { ProductCatalogueScope } from "../product-catalogue.types";

// -----------------------------------------------------------------------------

const COUNT_STEP = join(
  import.meta.dirname,
  "../../contract-product/__tests__/scenarios/i-am-told-how-many-plans-i-can-change-my-subscription-to/02"
);

type Recording = {
  request: { path: string };
  response: { body: { total: number } };
};

const COUNT = countRecording as unknown as Recording;

const scopeOf = (recording: unknown): ProductCatalogueScope => {
  const params = new URL(
    (recording as Recording).request.path,
    "http://recorded"
  ).searchParams;
  return {
    ids: (params.get("filter[id]") ?? "").split(","),
    currencyId: params.get("currency_id") ?? undefined,
    accountId: params.get("account_id") ?? undefined,
    recurringOnly: true,
    orderable: true,
    categories: false
  };
};

const RECORDED_SCOPE = scopeOf(countRecording);

const isPlanRead = ({ url }: { url: string }) =>
  new URL(url).pathname.endsWith("/basket/products");

const countKeys = () =>
  map(
    filter(queryClient.getQueryCache().getAll(), query =>
      isEqual(query.queryKey.slice(0, 2), ["product", "catalogue"])
    ),
    "queryKey"
  );

let replay: ReturnType<typeof startScenarioReplay> | undefined;
let sent: ReturnType<typeof observeRequests> | undefined;

afterEach(() => {
  sent?.stop();
  queryClient.clear();
  const gaps = replay?.gaps() ?? [];
  replay = undefined;
  expect(gaps).toStrictEqual([]);
});

async function signedIn(...steps: string[]): Promise<void> {
  replay = startScenarioReplay(server);
  await seedClientSession(server, { withBrandConfig: false });
  for (const step of steps) replayStep(server, step);
  sent = observeRequests(server, "/api/");
}

// -----------------------------------------------------------------------------

describe("product-catalogue loadCount — the rows-less count handle", () => {
  it("reports the envelope total on pagination with no rows on data", async () => {
    await signedIn(COUNT_STEP);

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true }
    });

    await vi.waitFor(() =>
      expect(catalogue.pagination.value.total).toBe(COUNT.response.body.total)
    );
    expect(catalogue.data.value).toBeNull();
  });

  it("marks the count cache key with a count segment of its own", async () => {
    await signedIn(COUNT_STEP);

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true }
    });
    await vi.waitFor(() =>
      expect(catalogue.pagination.value.total).toBe(COUNT.response.body.total)
    );

    const [key, ...more] = countKeys();
    expect(more).toStrictEqual([]);
    expect(some(key as unknown[], segment => segment === "count")).toBe(true);
  });

  it("has no page to move: its pagers are no-ops", async () => {
    await signedIn(COUNT_STEP);

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true }
    });
    await vi.waitFor(() =>
      expect(catalogue.pagination.value.total).toBe(COUNT.response.body.total)
    );

    expect(catalogue.meta.value.hasNextPage).toBe(false);
    expect(catalogue.meta.value.hasPrevPage).toBe(false);

    const before = filter(sent?.all(), isPlanRead).length;
    catalogue.nextPage();
    catalogue.prevPage();
    await new Promise(resolve => setTimeout(resolve));

    expect(filter(sent?.all(), isPlanRead)).toHaveLength(before);
    expect(catalogue.pagination.value.page).toBe(1);
  });

  it("counts only once the enabled gate opens", async () => {
    await signedIn(COUNT_STEP);
    const enabled = ref(false);

    const catalogue = useProductCatalogue({
      scope: { ...RECORDED_SCOPE, countOnly: true, enabled }
    });
    await catalogue.isReady();
    await new Promise(resolve => setTimeout(resolve));
    expect(filter(sent?.all(), isPlanRead)).toStrictEqual([]);

    enabled.value = true;

    await vi.waitFor(() =>
      expect(catalogue.pagination.value.total).toBe(COUNT.response.body.total)
    );
    expect(filter(sent?.all(), isPlanRead)).toHaveLength(1);
  });
});
