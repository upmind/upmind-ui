// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview query — an explicit currency wins over the basket's (FE-3206,
 * AC-29, ruling R11)
 *
 * ## Job To Be Done
 * `withCurrency` adds the basket `currency_code` only to a request that
 * carries no currency of its own. A change of plan loads the chosen plan in
 * the contract currency while the basket holds one, so the load sends the
 * contract `currency_id` and no basket `currency_code`. Each answer is the
 * staging recording of that exact request.
 *
 * ## What Breaks If These Fail
 * The client prices a change of plan in the basket's currency, or a storefront
 * request with no currency of its own loses the basket currency.
 */

import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { useQuery } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { useBasketCurrency } from "../../basket";
import {
  resetContractProductScopes,
  seedClientSession
} from "../../contract-product/__tests__/contract-product.int-helpers";
import planLoadRecording from "../../contract-product/__tests__/scenarios/choose-a-plan-and-see-what-the-change-costs-before-i-commit/03/get-basket-products-id-currency-id-omit-promotions-1.json";
import { server } from "../../contract-product/__tests__/setup.integration";
import { productMachine } from "../../product";
import { useUrl } from "../../../utils";
import { filter } from "lodash-es";
import type { Interpreter } from "xstate";

// -----------------------------------------------------------------------------

const PLAN_LOAD_STEP = join(
  import.meta.dirname,
  "../../contract-product/__tests__/scenarios/choose-a-plan-and-see-what-the-change-costs-before-i-commit/03"
);

const QUERY_FIXTURES = join(import.meta.dirname, "fixtures");

type Recording = {
  request: { path: string };
  response: { body: { data: { id: string } } };
};

const RECORDED = planLoadRecording as unknown as Recording;
const PLAN_ID = RECORDED.response.body.data.id;
const CONTRACT_CURRENCY = new URL(
  RECORDED.request.path,
  "http://recorded"
).searchParams.get("currency_id") as string;

const running: Interpreter<never>[] = [];
let replay: ReturnType<typeof startScenarioReplay> | undefined;
let sent: ReturnType<typeof observeRequests> | undefined;

afterEach(() => {
  for (const service of running.splice(0)) service.stop();
  sent?.stop();
  resetContractProductScopes();
  const gaps = replay?.gaps() ?? [];
  replay = undefined;
  expect(gaps).toStrictEqual([]);
});

/** A signed-in client whose basket holds a currency; resolves that currency. */
async function withBasketCurrency(): Promise<string> {
  replay = startScenarioReplay(server);
  await seedClientSession();
  await useBasketCurrency().isReady();
  await vi.waitFor(() =>
    expect(useBasketCurrency().currencyCode.value).toBeTruthy()
  );
  sent = observeRequests(server, "/api/");
  return useBasketCurrency().currencyCode.value as string;
}

// -----------------------------------------------------------------------------

describe("AC-29 — an explicit currency wins over the basket's (R11)", () => {
  it("a load in the contract currency sends no basket currency", async () => {
    await withBasketCurrency();
    replayStep(server, PLAN_LOAD_STEP);

    const service = interpret(
      productMachine.withContext({
        model: { productId: PLAN_ID, quantity: 1, term: 1 },
        coupons: [],
        currencyId: CONTRACT_CURRENCY,
        promotions: false,
        silent: true
      } as never)
    ).start();
    running.push(service as unknown as Interpreter<never>);
    await vi.waitFor(() =>
      expect(service.getSnapshot().matches("available")).toBe(true)
    );

    const [load] = filter(
      sent?.all(),
      ({ method, url }) =>
        method === "GET" &&
        new URL(url).pathname.endsWith(`/basket/products/${PLAN_ID}`)
    );
    const params = new URL(load.url).searchParams;
    expect(params.get("currency_id")).toBe(CONTRACT_CURRENCY);
    expect(params.get("currency_code")).toBeNull();
  });

  it("a request with no currency of its own still carries the basket currency", async () => {
    const basketCurrency = await withBasketCurrency();
    replayStep(server, QUERY_FIXTURES);

    await useQuery().request({
      url: useUrl("brand/settings"),
      withCurrency: true
    });

    const [request] = filter(sent?.all(), ({ url }) =>
      new URL(url).pathname.endsWith("/brand/settings")
    );
    expect(new URL(request.url).searchParams.get("currency_code")).toBe(
      basketCurrency
    );
  });
});
