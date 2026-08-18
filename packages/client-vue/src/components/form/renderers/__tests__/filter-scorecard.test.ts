/**
 * @fileoverview Filter tester scorecard
 *
 * ## Job To Be Done
 * The bespoke `Filter` uiType and its branching mega-renderer are gone, so which
 * control a filter draws is decided by JSON Forms' standard rank contest between
 * individual `Control` renderers, scored on `options.format` AND the leaf's own
 * schema. This file proves who claims each element of both consumer bars, at
 * what rank, and — the half a rank number cannot show — who declines.
 *
 * Scored against `formRenderers`, the registry `UpmForm` binds, so a claim here
 * is a claim about the shipped registry. That a filter renderer also OUTRANKS
 * the generic ui control for the same leaf is proven on the rendered surface in
 * `filter-format-dispatch.test.ts`.
 *
 * ## What Breaks If These Fail
 * A leaf silently falls to the generic control (a raw select where a tri-state
 * belongs), or two renderers claim the same element and the winner is whichever
 * was registered last.
 */

import { describe, expect, it } from "vitest";
import { formRenderers } from "../index";
import {
  clientEmailHistoryQuery,
  clientEmailQuery,
  elementFor,
  rangeQuery,
  uischemaWithOptions
} from "./filter.harness";
import { filter, map } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

type ScoredEntry = {
  renderer: { __name?: string };
  tester: (
    uischema: UISchemaElement,
    schema: JsonSchema7,
    context: { rootSchema: JsonSchema7; config: unknown }
  ) => number;
};

const NOT_APPLICABLE = -1;

/** Every registry entry that CLAIMS an element, with the rank it claimed at. */
const claimants = (element: UISchemaElement, rootSchema: JsonSchema7) =>
  filter(
    map(formRenderers as unknown as ScoredEntry[], entry => ({
      name: entry.renderer.__name,
      rank: entry.tester(element, rootSchema, { rootSchema, config: {} })
    })),
    scored => scored.rank > NOT_APPLICABLE
  );

const SEARCH = "search";
const BUTTON_GROUP = "button-group";
const TOGGLE_GROUP = "toggle-group";

const bars = [
  [
    "client-email",
    clientEmailQuery(),
    {
      [SEARCH]: "#/properties/filters/properties/email/properties/like",
      [BUTTON_GROUP]: "#/properties/filters/properties/verified/properties/eq",
      [TOGGLE_GROUP]: "#/properties/filters/properties/bounced/properties/eq"
    }
  ],
  [
    "client-email-history",
    clientEmailHistoryQuery(),
    {
      [SEARCH]: "#/properties/filters/properties/subject/properties/like",
      [BUTTON_GROUP]: "#/properties/filters/properties/sent/properties/eq",
      [TOGGLE_GROUP]: "#/properties/filters/properties/bounced/properties/eq"
    }
  ]
] as const;

describe.each(bars)(
  "the %s bar hands each element to exactly one filter renderer",
  (_name, declaration, scopes) => {
    const claimFor = (scope: string) =>
      claimants(
        elementFor(declaration.uischema, scope),
        declaration.schema as JsonSchema7
      );

    it("gives the boolean leaf asking for a button group to the button group", () => {
      expect(claimFor(scopes[BUTTON_GROUP])).toEqual([
        { name: "FilterButtonGroupRenderer", rank: 3 }
      ]);
    });

    it("gives the boolean leaf asking for a toggle group to the toggle group", () => {
      expect(claimFor(scopes[TOGGLE_GROUP])).toEqual([
        { name: "FilterToggleGroupRenderer", rank: 3 }
      ]);
    });

    it("gives the string leaf asking for a search box to the search renderer", () => {
      expect(claimFor(scopes[SEARCH])).toEqual([
        { name: "FilterSearchRenderer", rank: 3 }
      ]);
    });

    it("gives the bar itself to the bar layout, below every control", () => {
      expect(
        claimants(declaration.uischema, declaration.schema as JsonSchema7)
      ).toEqual([{ name: "FilterBarRenderer", rank: 2 }]);
    });
  }
);

describe("the two-ended object column asking for a range", () => {
  const { schema, uischema } = rangeQuery();
  const COLUMN = "#/properties/filters/properties/created_at";

  it("goes to the range renderer", () => {
    expect(claimants(elementFor(uischema, COLUMN), schema)).toEqual([
      { name: "FilterRangeRenderer", rank: 3 }
    ]);
  });

  it("is declined by every filter renderer once it stops asking for a range", () => {
    const other = uischemaWithOptions(uischema, "/created_at", {
      format: "search"
    });

    expect(claimants(elementFor(other, COLUMN), schema)).toEqual([]);
  });
});

describe("the uischema's format is what moves the claim", () => {
  const { schema, uischema } = clientEmailQuery();
  const VERIFIED = "#/properties/filters/properties/verified/properties/eq";

  const claimAfter = (options?: Record<string, unknown>) =>
    claimants(
      elementFor(
        uischemaWithOptions(uischema, "/verified/properties/eq", options),
        VERIFIED
      ),
      schema as JsonSchema7
    );

  it("hands the same leaf to the other control when the format is swapped", () => {
    expect(claimAfter({ format: TOGGLE_GROUP })).toEqual([
      { name: "FilterToggleGroupRenderer", rank: 3 }
    ]);
  });

  it("leaves a leaf naming NO format to the generic renderer for its type", () => {
    expect(claimAfter()).toEqual([]);
  });

  it("leaves a leaf naming an unknown format to the generic renderer too", () => {
    expect(claimAfter({ format: "between" })).toEqual([]);
  });
});

describe("the schema half of the scorecard is load-bearing", () => {
  const { schema, uischema } = clientEmailQuery();
  const EMAIL = "#/properties/filters/properties/email/properties/like";
  const VERIFIED = "#/properties/filters/properties/verified/properties/eq";

  it("declines a boolean format asked of a string leaf", () => {
    const misdeclared = uischemaWithOptions(
      uischema,
      "/email/properties/like",
      { format: BUTTON_GROUP }
    );

    expect(
      claimants(elementFor(misdeclared, EMAIL), schema as JsonSchema7)
    ).toEqual([]);
  });

  it("declines a search format asked of a boolean leaf", () => {
    const misdeclared = uischemaWithOptions(
      uischema,
      "/verified/properties/eq",
      { format: SEARCH }
    );

    expect(
      claimants(elementFor(misdeclared, VERIFIED), schema as JsonSchema7)
    ).toEqual([]);
  });

  it("declines a tri-state format asked of a boolean leaf declaring no members", () => {
    const bare = {
      type: "object",
      properties: {
        filters: {
          type: "object",
          properties: {
            verified: {
              type: "object",
              properties: { eq: { type: ["boolean", "null"] } }
            }
          }
        }
      }
    } as JsonSchema7;

    expect(claimants(elementFor(uischema, VERIFIED), bare)).toEqual([]);
  });
});
