/**
 * @module form/renderers/__tests__/filter-treatment
 * @description The tri-state's TREATMENT dispatch (P1-R3): both treatments serve
 * the identical three states, so which one a column draws is named by that
 * column's own uischema and never inferred from its schema.
 *
 * Negative control: `filter-treatment.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless-test-kit/client-email.internal-kit";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  BUTTON_GROUP_POSITION,
  TOGGLE_GROUP_POSITION,
  labelOf,
  mountFilters,
  positionsOf
} from "./filter.harness";
import { cloneDeep, get, unset } from "lodash-es";
import type { UISchemaElement } from "@jsonforms/core";

const BOUNCED_ELEMENT = ["elements", 1, "elements", 1, "options"];

const uischemaWithout = (option: string) => {
  const uischema = cloneDeep(useQueryUischema());
  unset(uischema, [...BOUNCED_ELEMENT, option]);
  return uischema as UISchemaElement;
};

describe("the treatment a column draws is the one its uischema names", () => {
  it("draws the labelled three-position group for the column that asks for it", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(column("verified").findAll(BUTTON_GROUP_POSITION)).toHaveLength(3);
    expect(column("verified").findAll(TOGGLE_GROUP_POSITION)).toHaveLength(0);
  });

  it("draws the label-less two-position group for the column that asks for it", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(column("bounced").findAll(TOGGLE_GROUP_POSITION)).toHaveLength(2);
    expect(column("bounced").findAll(BUTTON_GROUP_POSITION)).toHaveLength(0);
    expect(labelOf(column("bounced"))).toBe("");
  });

  it("keeps its label on the treatment that declares an unset position", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(labelOf(column("verified"))).toBeTruthy();
    expect(positionsOf(column("verified"))).toContain(text.all);
    expect(positionsOf(column("bounced"))).not.toContain(text.all);
  });

  it("draws two different controls from one identical column shape", async () => {
    const column = (name: string) =>
      get(useQuerySchema(), [
        "properties",
        "filters",
        "properties",
        name,
        "properties"
      ]);

    expect(column("bounced")).toEqual(column("verified"));

    const { column: rendered } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(positionsOf(rendered("verified"))).not.toEqual(
      positionsOf(rendered("bounced"))
    );
  });

  it("falls back to the treatment that shows its unset position when none is named", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: uischemaWithout("treatment")
    });

    expect(column("bounced").findAll(BUTTON_GROUP_POSITION)).toHaveLength(3);
    expect(positionsOf(column("bounced"))).toContain(text.all);
  });
});
