/**
 * @fileoverview contract-product picker option unit tests
 *
 * ## Job To Be Done
 * Pin the option the product picker offers for each of a client's products:
 * its value is the product id the manager loads by, and its label is the
 * product's shared title — the catalogue product's trimmed name, then its
 * service identifier in brackets when it has one, or the identifier alone for
 * a domain. Rows are the module's own committed staging recordings.
 *
 * ## What Breaks If These Fail
 * A client cannot tell their products apart in the picker, or picking one
 * opens a different product, or none.
 */
import { describe, expect, it } from "vitest";
import { mapContractProductPickerItem } from "../contract-product.mappers";
import { titleOf } from "./contract-product.steps";
import withoutIdentifierRecording from "./scenarios/a-one-time-purchase-shows-the-price-i-paid-for-it-as-my-brands-tax-rule-prices-it/03/get-contracts-products-exclude-delegated-1-filter-billing-cycle-days-eq-0-skip-count-1-split-count-1.json";
import withIdentifierRecording from "./scenarios/each-of-my-products-shows-the-date-i-bought-it/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import { filter, map } from "lodash-es";
import type { IContractProduct } from "@upmind-automation/types";

type RecordedRow = Parameters<typeof titleOf>[0] & IContractProduct;

const rowsOf = (recording: unknown) =>
  (recording as { response: { body: { data: RecordedRow[] } } }).response.body
    .data;

describe("contract-product — the product picker's options", () => {
  const rows = [
    ...rowsOf(withIdentifierRecording),
    ...rowsOf(withoutIdentifierRecording)
  ];
  const options = map(rows, row => mapContractProductPickerItem(row));

  it("picks each product by its id", () => {
    expect(map(options, "value")).toEqual(map(rows, "id"));
  });

  it("names each product by its shared title", () => {
    expect(filter(rows, "service_identifier")).not.toHaveLength(0);
    expect(filter(rows, row => !row.service_identifier)).not.toHaveLength(0);

    expect(map(options, "label")).toEqual(map(rows, titleOf));
  });
});
