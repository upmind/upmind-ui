// -----------------------------------------------------------------------------
/**
 * @fileoverview contract-product contractBillingCycleLabel mapping
 *
 * ## Job To Be Done
 * Pins the `contractBillingCycleLabel` that `mapContractProduct` publishes from
 * the recorded `contract` relation — the product record's "Contract billing
 * cycle". The recorded contract and product terms both bill monthly, so a
 * mapping that read the PRODUCT term would still pass against the recording
 * alone; the second case feeds the mapper a variant of the recorded row whose
 * contract term differs from the product term, pinning the label to the
 * CONTRACT cycle.
 *
 * ## What Breaks If These Fail
 * The product record shows the wrong billing cycle for its owning contract — the
 * product's own term, or a blank "Contract billing cycle".
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapContractProduct } from "..";
import { cloneDeep } from "lodash-es";
import type { IContractProduct } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

function recordedProduct(): IContractProduct {
  return getFixtureBody<{ data: IContractProduct }>(
    "get-contract-products-id",
    {
      recordingsDir: FIXTURES_DIR
    }
  ).data;
}

/** The term catalogue's label per cycle length (`i18n/.../term-en.json`) — `term.<key>` here, where i18n returns the key. */
const TERM_LABEL: Record<number, string> = {
  1: "term.monthly",
  12: "term.annually"
};

describe("mapContractProduct — contractBillingCycleLabel", () => {
  it("labels the owning contract's billing cycle from the recorded contract term", () => {
    const raw = recordedProduct();
    const contractMonths = raw.contract?.billing_cycle_months;
    expect(
      contractMonths,
      "re-record: contract.billing_cycle_months absent"
    ).toBeGreaterThan(0);

    expect(mapContractProduct(raw).contractBillingCycleLabel).toBe(
      TERM_LABEL[contractMonths!]
    );
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
