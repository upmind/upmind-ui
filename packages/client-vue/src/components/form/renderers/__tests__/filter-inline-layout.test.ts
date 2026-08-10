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
} from "@upmind-automation/headless-test-kit/client-email.internal-kit";
import form from "@upmind-automation/i18n/core/form-en.json";
import { fieldLayoutOf, labelOf, mountFilters } from "./filter.harness";

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
