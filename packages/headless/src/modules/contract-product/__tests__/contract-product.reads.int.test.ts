// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.reads
 * @description Pins the mapped `contractBillingCycleLabel` the single
 * contract-product read (`useContractProduct`) publishes from its recorded
 * `contract` relation (ADR 035) — the product record's "Contract billing cycle"
 * (FE-3206). The recorded contract and product terms both bill monthly, so a
 * mapping that read the PRODUCT term would still pass against the recording
 * alone; the second case feeds the public `mapContractProduct` a variant of the
 * recorded row whose contract term differs from the product term, pinning the
 * label to the CONTRACT cycle.
 *
 * ## What Breaks If These Fail
 * The product record shows the wrong billing cycle for its owning contract — the
 * product's own term, or a blank "Contract billing cycle".
 */

import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { mapContractProduct, useContractProduct } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  resetContractProductScopes,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";
import { cloneDeep } from "lodash-es";
import type { IContractProduct } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");
const PRODUCT_ID = "785d26e9-6783-d169-497f-314502e70439";

function recordedProduct(): IContractProduct {
  return getFixtureBody<{ data: IContractProduct }>(
    "get-contract-products-id",
    {
      recordingsDir: FIXTURES_DIR
    }
  ).data;
}

beforeEach(async () => {
  await seedClientSession();
  replayStep(server, FIXTURES_DIR);
});

afterEach(() => resetContractProductScopes());

async function readProduct() {
  const manager = useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(PRODUCT_ID);
  await manager.useActions().isReady();
  const context = manager.useContext();
  await vi.waitFor(() => {
    expect(context.contractProduct.value).toBeTruthy();
  });
  return context.contractProduct.value!;
}

// -----------------------------------------------------------------------------

/** The term catalogue's label per cycle length (`i18n/.../term-en.json`) — `term.<key>` in this replay env, where i18n returns the key. */
const TERM_LABEL: Record<number, string> = {
  1: "term.monthly",
  12: "term.annually"
};

describe("useContractProduct — contractBillingCycleLabel", () => {
  it("labels the owning contract's billing cycle from the recorded contract term", async () => {
    const product = await readProduct();
    const raw = recordedProduct();
    const contractMonths = raw.contract?.billing_cycle_months;
    expect(
      contractMonths,
      "re-record: contract.billing_cycle_months absent"
    ).toBeGreaterThan(0);
    expect(product.contractBillingCycleLabel).toBe(TERM_LABEL[contractMonths!]);
  });

  it("reads the CONTRACT term, not the product's own, when the two differ", () => {
    const raw = recordedProduct();
    const variant = cloneDeep(raw) as typeof raw & {
      contract: NonNullable<(typeof raw)["contract"]>;
    };
    variant.contract.billing_cycle_months = 12;

    const mapped = mapContractProduct(variant);

    expect(mapped.contractBillingCycleLabel).toBe(TERM_LABEL[12]);
    expect(mapped.billingCycle).toBe(TERM_LABEL[raw.billing_cycle_months]);
    expect(mapped.contractBillingCycleLabel).not.toBe(mapped.billingCycle);
  });
});
