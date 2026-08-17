/**
 * @module form/renderers/__tests__/filter-state-names
 * @description The label-less treatment's STATE NAMES (P1-R3): dropping the
 * label only works if the positions say what they filter, so the uischema's own
 * `states` keys — not the schema's generic Yes/No — name them.
 *
 * Negative control: `filter-state-names.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { internalKits } from "@upmind-automation/headless/testing";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  TOGGLE_GROUP_POSITION,
  mountFilters,
  positionsOf,
  uischemaWithout
} from "./filter.harness";
import { map } from "lodash-es";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

describe("the label-less treatment names its own states", () => {
  it("reads each position's name from the uischema's states keys", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(positionsOf(column("bounced"))).toEqual([
      text.bounced_label,
      text.not_bounced_label
    ]);
  });

  it("says nothing generic where the column it filters should be named", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(positionsOf(column("bounced"))).not.toContain(text.yes);
    expect(positionsOf(column("bounced"))).not.toContain(text.no);
  });

  it("announces the same state name to assistive tech", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(
      map(column("bounced").findAll(TOGGLE_GROUP_POSITION), node =>
        node.attributes("aria-label")
      )
    ).toEqual([text.bounced_label, text.not_bounced_label]);
  });

  it("leaves the labelled treatment on the schema's own titles", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(positionsOf(column("verified"))).toContain(text.yes);
    expect(positionsOf(column("verified"))).not.toContain(text.bounced_label);
  });

  it("falls back to the schema's titles for a column declaring no states", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: uischemaWithout(useQueryUischema(), "bounced", "states")
    });

    expect(positionsOf(column("bounced"))).toEqual([text.yes, text.no]);
  });
});
