// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProducts — a row read without its brand is priced
 * by the portal brand's tax rule (integration; AC-1, gap G6 / B4)
 *
 * ## Job To Be Done
 * A row's price follows legacy `getPriceTermSummary`, net or gross per the
 * brand's tax type: the record's own brand, else the portal brand. Serve the
 * RECORDED portal brand (`tax_type` EXCLUDE_TAX), ready it as the app does at
 * boot, and serve a RECORDED list read with
 * no `with` member, whose rows carry no brand and whose net and gross figures
 * differ, and prove each row shows its net figure.
 *
 * ## Negative control
 * `contract-product.list-rows-and-picker.price-tax-aware.must-fail.patch`.
 *
 * ## What Breaks If This Fails
 * A client on a tax-exclusive brand sees tax-inclusive prices on every row
 * the list reads without a brand.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { BrandTaxTypes } from "@upmind-automation/types";
import { useContractProducts } from "..";
import { useBrand } from "../../brand";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";
import { every, forEach, keyBy, some } from "lodash-es";

// -----------------------------------------------------------------------------

type RecordedRow = {
  id: string;
  billing_cycle_months: number;
  configuration_total_recurring_amount_formatted: string;
  configuration_total_recurring_net_amount_formatted: string;
  configuration_net_amount_discounted_formatted: string;
  brand?: unknown;
};

describe("useContractProducts — a row with no brand of its own is priced by my portal brand (AC-1)", () => {
  it("AC-1 a product read without its brand is priced by my portal brand's tax rule", async () => {
    const brand = recorded.portalBrand().response;
    expect(
      (brand.body as { data: { tax_type: BrandTaxTypes } }).data.tax_type
    ).toBe(BrandTaxTypes.EXCLUDE_TAX);
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/brand/settings", () =>
        HttpResponse.json(brand.body as Record<string, unknown>, {
          status: brand.status
        })
      ),
      http.get("*/contracts_products", () =>
        HttpResponse.json(recorded.brandlessRows(), { status: 200 })
      )
    );

    await useBrand().refresh();
    await useBrand().isReady();
    expect(useBrand().taxType.value).toBe(BrandTaxTypes.EXCLUDE_TAX);

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const rows = recorded.brandlessRows().data as unknown as RecordedRow[];
    const byId = keyBy(collection.useContext().data.value, "id");

    expect(every(rows, row => !row.brand)).toBe(true);
    expect(
      some(
        rows,
        row =>
          row.configuration_total_recurring_net_amount_formatted !==
          row.configuration_total_recurring_amount_formatted
      )
    ).toBe(true);
    forEach(rows, row => {
      expect(byId[row.id]?.priceFormatted).toBe(
        row.billing_cycle_months > 0
          ? row.configuration_total_recurring_net_amount_formatted
          : row.configuration_net_amount_discounted_formatted
      );
    });
  });
});
