/**
 * @fileoverview Which control each filter format DRAWS
 *
 * ## Job To Be Done
 * The scorecard's arithmetic (`filter-scorecard.test.ts`) cannot show that a
 * filter renderer beats the generic ui control for the same leaf. This file
 * measures it where it counts — on the rendered surface — for all four formats
 * and both consumer bars.
 *
 * Both tri-state controls serve the identical three states, so `options.format`
 * is what names which one a column gets and the schema never is: `verified` and
 * `bounced` declare byte-identical leaves and draw different controls.
 *
 * ## What Breaks If These Fail
 * The bar draws a raw `<select>` of `true`/`false`/`null` where the operator
 * approved a tri-state, or the two tri-states become indistinguishable and the
 * button group's unset position disappears.
 */

import { describe, expect, it } from "vitest";
import {
  BUTTON_GROUP_POSITION,
  TOGGLE_GROUP_POSITION,
  clientEmailHistoryQuery,
  clientEmailQuery,
  mountFilters,
  positionsOf,
  rangeQuery,
  uischemaWithOptions
} from "./filter.harness";
import { get } from "lodash-es";

/** The search box's clear button. */
const CLEAR = '[data-test-key="button"]';

const bars = [
  [
    "client-email",
    clientEmailQuery,
    {
      search: "filters.email.like",
      buttonGroup: "filters.verified.eq",
      toggleGroup: "filters.bounced.eq"
    }
  ],
  [
    "client-email-history",
    clientEmailHistoryQuery,
    {
      search: "filters.subject.like",
      buttonGroup: "filters.sent.eq",
      toggleGroup: "filters.bounced.eq"
    }
  ]
] as const;

describe.each(bars)(
  "the %s bar draws the control each leaf's uischema names",
  (_name, declaration, paths) => {
    const mounted = () => mountFilters(declaration());

    it("draws all three positions of the button group, unset included", async () => {
      const { column } = await mounted();

      expect(
        column(paths.buttonGroup).findAll(BUTTON_GROUP_POSITION)
      ).toHaveLength(3);
      expect(column(paths.buttonGroup).findAll("select")).toHaveLength(0);
    });

    it("draws only the two set positions of the toggle group", async () => {
      const { column } = await mounted();

      expect(
        column(paths.toggleGroup).findAll(TOGGLE_GROUP_POSITION)
      ).toHaveLength(2);
      expect(column(paths.toggleGroup).findAll("select")).toHaveLength(0);
    });

    it("draws a text box carrying its own clear for the leaf that asks for a search", async () => {
      const { column } = await mounted();

      expect(column(paths.search).find('input[type="text"]').exists()).toBe(
        true
      );
      expect(column(paths.search).findAll(CLEAR)).toHaveLength(1);
    });

    it("draws two different controls from one identical leaf shape", async () => {
      const { schema } = declaration();
      const leaf = (name: string) =>
        get(schema, [
          "properties",
          "filters",
          "properties",
          name,
          "properties",
          "eq"
        ]);

      expect(leaf(paths.toggleGroup.split(".")[1])).toEqual(
        leaf(paths.buttonGroup.split(".")[1])
      );

      const { column } = await mounted();

      expect(positionsOf(column(paths.buttonGroup))).not.toEqual(
        positionsOf(column(paths.toggleGroup))
      );
    });
  }
);

describe("swapping the two formats swaps the drawn controls", () => {
  it("draws each column with the other's control", async () => {
    const { schema, uischema } = clientEmailQuery();
    const swapped = uischemaWithOptions(
      uischemaWithOptions(uischema, "/verified/properties/eq", {
        format: "toggle-group",
        noLabel: true,
        optionalText: ""
      }),
      "/bounced/properties/eq",
      { format: "button-group", noLabel: true, optionalText: "" }
    );

    const { column } = await mountFilters({ schema, uischema: swapped });

    expect(
      column("filters.verified.eq").findAll(TOGGLE_GROUP_POSITION)
    ).toHaveLength(2);
    expect(
      column("filters.bounced.eq").findAll(BUTTON_GROUP_POSITION)
    ).toHaveLength(3);
  });
});

describe("a leaf naming no format falls to the generic renderer for its type", () => {
  it("gives the enumerated boolean leaf the ordinary select", async () => {
    const { schema, uischema } = clientEmailQuery();
    const plain = uischemaWithOptions(uischema, "/verified/properties/eq");

    const { column } = await mountFilters({ schema, uischema: plain });

    expect(
      column("filters.verified.eq")
        .find('[data-test-key="select-trigger"]')
        .exists()
    ).toBe(true);
    expect(positionsOf(column("filters.verified.eq"))).toEqual([]);
  });

  it("gives the string leaf a plain box with no clear affordance", async () => {
    const { schema, uischema } = clientEmailQuery();
    const plain = uischemaWithOptions(uischema, "/email/properties/like");

    const { column, settle } = await mountFilters({ schema, uischema: plain });

    await column("filters.email.like").find("input").setValue("case");
    await settle();

    expect(column("filters.email.like").find("input").exists()).toBe(true);
    expect(column("filters.email.like").findAll(CLEAR)).toHaveLength(0);
  });
});

describe("the range control draws both ends of the column it scopes", () => {
  it("draws a from end and a to end for a gte + lte column", async () => {
    const { column } = await mountFilters(rangeQuery());
    const range = column("filters.created_at");

    expect(range.find('[data-test-value$="-from"]').exists()).toBe(true);
    expect(range.find('[data-test-value$="-to"]').exists()).toBe(true);
  });
});
