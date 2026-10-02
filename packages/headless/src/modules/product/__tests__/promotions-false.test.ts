// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview product — a load told `promotions: false` (FE-3206, AC-29,
 * ruling R12)
 *
 * ## Job To Be Done
 * A change of plan loads the chosen plan without the storefront promotions.
 * The stock product machine, seeded with `promotions: false`, sends
 * `omit_promotions=1` and no `promotions`, and keeps its answer under its own
 * cache key. The answer is the staging recording of that exact request, from
 * the contract-product "Choose a plan" scenario that recorded it.
 *
 * ## What Breaks If These Fail
 * A change of plan is priced with a storefront promotion the platform will not
 * honour on a change, or a storefront load of the same plan is served the
 * migration's cached answer.
 */

import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { productMachine } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import {
  resetContractProductScopes,
  seedClientSession
} from "../../contract-product/__tests__/contract-product.int-helpers";
import planLoadRecording from "../../contract-product/__tests__/scenarios/choose-a-plan-and-see-what-the-change-costs-before-i-commit/03/get-basket-products-id-currency-id-omit-promotions-1.json";
import { server } from "../../contract-product/__tests__/setup.integration";
import { queryClient } from "../../query/client";
import { filter, isEqual, map, some } from "lodash-es";
import type { Interpreter } from "xstate";

// -----------------------------------------------------------------------------

const PLAN_LOAD_STEP = join(
  import.meta.dirname,
  "../../contract-product/__tests__/scenarios/choose-a-plan-and-see-what-the-change-costs-before-i-commit/03"
);

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

/** Starts the stock product machine on the recorded plan, told to omit promotions. */
async function loadWithoutPromotions(): Promise<void> {
  replay = startScenarioReplay(server);
  await seedClientSession();
  replayStep(server, PLAN_LOAD_STEP);
  sent = observeRequests(server, "/api/");
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
}

const planLoads = () =>
  filter(
    sent?.all(),
    ({ method, url }) =>
      method === "GET" &&
      new URL(url).pathname.endsWith(`/basket/products/${PLAN_ID}`)
  );

// -----------------------------------------------------------------------------

describe("AC-29 — a load without promotions (R12)", () => {
  it("omits promotions from the load", async () => {
    await loadWithoutPromotions();

    const [load, ...more] = planLoads();
    expect(more).toStrictEqual([]);
    const params = new URL(load.url).searchParams;
    expect(params.get("omit_promotions")).toBe("1");
    expect(params.get("promotions")).toBeNull();
  });

  it("keeps its answer under a key that names no promotions, apart from a load with promotions", async () => {
    await loadWithoutPromotions();

    const keys = map(
      filter(queryClient.getQueryCache().getAll(), query =>
        isEqual(query.queryKey.slice(0, 2), ["product", PLAN_ID])
      ),
      query => query.queryKey[2]
    );
    expect(some(keys, { basketPromotions: false })).toBe(true);
  });
});
