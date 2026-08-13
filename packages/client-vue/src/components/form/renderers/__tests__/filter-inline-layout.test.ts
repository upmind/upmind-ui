/**
 * @module form/renderers/__tests__/filter-inline-layout
 * @description The INLINE field layout the tri-state is owed (P1-R3): the
 * rejected treatment put the control on its own line, far from the label it
 * belongs to. The primitive now lays the two out on ONE row for a boolean
 * column, and leaves every other column stacked.
 *
 * Negative control: `filter-inline-layout.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import form from "@upmind-automation/i18n/core/form-en.json";
import { fieldLayoutOf, labelOf, mountFilters } from "./filter.harness";
import { some, split } from "lodash-es";
import type { DOMWrapper } from "@vue/test-utils";

const ROW = "flex-row";
const COLUMN = "flex-col";

const mount = () =>
  mountFilters({ schema: useQuerySchema(), uischema: useQueryUischema() });

describe("a boolean column lays its label and control on one row", () => {
  it("draws both tri-state treatments in a row, never a column", async () => {
    const { column } = await mount();

    for (const name of ["verified", "bounced"]) {
      expect(fieldLayoutOf(column(name))).toContain(ROW);
      expect(fieldLayoutOf(column(name))).not.toContain(COLUMN);
    }
  });

  it("keeps the label in that row rather than winning the row by dropping it", async () => {
    const { column } = await mount();

    expect(labelOf(column("verified"))).toBe(form.verified_filter.label);
  });
});

describe("every other column keeps the stacked layout", () => {
  it("leaves the full-width search box stacked", async () => {
    const { column } = await mount();

    expect(fieldLayoutOf(column("email"))).toContain(COLUMN);
    expect(fieldLayoutOf(column("email"))).not.toContain(ROW);
  });
});

/**
 * `R6-4` — driving live, the operator found the email search eating the filter
 * row: "the email-address search input needs a MAX width". The slack still goes
 * to the declared growing element, but the recipe caps how much of it a toolbar
 * hands over, so the facets sharing the row are never stranded at the far end.
 * The cap belongs to this recipe — the row item every toolbar draws — not to one
 * playground's override of it.
 */
describe("the growing column takes the row's slack up to a cap (R6-4)", () => {
  /** The row ITEM the recipe dresses — the wrapper the field sits in. */
  const itemOf = (column: DOMWrapper<Element>) =>
    split(column.element.parentElement?.className ?? "", /\s+/);

  it("caps the search rather than letting it run the whole row", async () => {
    const { column } = await mount();
    const growing = itemOf(column("email"));

    expect(some(growing, token => /(^|:)max-w-/.test(token))).toBe(true);
    expect(some(growing, token => token === "flex-1")).toBe(true);
  });

  it("leaves the facets beside it un-grown and un-capped", async () => {
    const { column } = await mount();

    for (const name of ["verified", "bounced"]) {
      expect(
        some(itemOf(column(name)), token => /(^|:)max-w-/.test(token))
      ).toBe(false);
      expect(some(itemOf(column(name)), token => token === "flex-1")).toBe(
        false
      );
    }
  });
});
