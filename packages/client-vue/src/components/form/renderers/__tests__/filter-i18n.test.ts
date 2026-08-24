/**
 * @module form/renderers/__tests__/filter-i18n
 * @description The filter bar's i18n, resolved through JSON FORMS' OWN pipeline
 * rather than by a component reaching into `inject("jsonforms").i18n` itself —
 * the whole reason the bespoke `Filter` renderer was retired. Standard `Control`
 * renderers put every string on the same keys — `<i18n>.label` and
 * `<i18n>.<member>` per enum member — so this file asserts the RENDERED string
 * against the SHIPPED catalogue entry for those keys. A key-shaped assertion
 * would be green with no translation at all, and an assertion written against a
 * hand-typed English string would be green with no catalogue at all.
 *
 * The consumer bars all declare `noLabel`, so the label path is proven on the
 * same element with that option lifted: suppression is `filter-optional-
 * indicator.test.ts`'s subject, resolution is this file's.
 *
 * Negative control: pending — see the hand-off report.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { h } from "vue";
import {
  TOGGLE_GROUP_POSITION,
  catalogue,
  clientEmailHistoryQuery,
  clientEmailQuery,
  labelOf,
  mountFilters,
  positionNamed,
  positionsOf,
  positionAt,
  rawKeysIn,
  renderedStrings,
  uischemaWithOptions
} from "./filter.harness";
import { compact, flatMap, filter, get, map, trim } from "lodash-es";
import type { QueryDeclaration } from "./filter.harness";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";

const BUTTON_GROUP = "filters.verified.eq";
const TOGGLE_GROUP = "filters.bounced.eq";
const SEARCH = "filters.email.like";

const VERIFIED = "/verified/properties/eq";

const shipped = () => mountFilters(clientEmailQuery());

/** The verified column with one option changed, the rest of the bar untouched. */
const verifiedDeclaring = (options: Record<string, unknown>) => {
  const { schema, uischema } = clientEmailQuery();
  return { schema, uischema: uischemaWithOptions(uischema, VERIFIED, options) };
};

/** The verified column pointed at another catalogue entry entirely. */
const verifiedNamed = (i18n: string) => {
  const { schema, uischema } = clientEmailQuery();
  const next = uischemaWithOptions(uischema, VERIFIED, {
    format: "button-group",
    optionalText: ""
  }) as Layout;

  return {
    schema,
    uischema: {
      ...next,
      elements: map(next.elements, element =>
        get(element, "scope") ===
        "#/properties/filters/properties/verified/properties/eq"
          ? { ...element, i18n }
          : element
      )
    } as UISchemaElement
  };
};

describe("control labels resolve on the pipeline's own <i18n>.label key", () => {
  it("renders the catalogue entry for the key the uischema declares", async () => {
    const { column } = await mountFilters(
      verifiedDeclaring({ format: "button-group", optionalText: "" })
    );

    expect(labelOf(column(BUTTON_GROUP))).toBe(
      catalogue("form.verified_filter.label")
    );
  });

  it("moves the rendered label when the element's i18n key moves", async () => {
    const { column } = await mountFilters(verifiedNamed("form.sent_filter"));

    expect(labelOf(column(BUTTON_GROUP))).toBe(
      catalogue("form.sent_filter.label")
    );
    expect(labelOf(column(BUTTON_GROUP))).not.toBe(
      catalogue("form.verified_filter.label")
    );
  });

  it("renders no raw i18n key anywhere in the bar, at any position", async () => {
    const { column, settle, wrapper } = await shipped();

    for (const member of ["true", "false", "null"]) {
      expect(rawKeysIn(renderedStrings(wrapper))).toEqual([]);
      await positionNamed(
        column(BUTTON_GROUP),
        catalogue(`form.verified_filter.${member}`)
      ).trigger("click");
      await settle();
    }

    expect(rawKeysIn(renderedStrings(wrapper))).toEqual([]);
  });
});

describe("tri-state option labels resolve on <i18n>.<member>", () => {
  it("names every position of the button group from its own key's members", async () => {
    const { column } = await shipped();

    expect(positionsOf(column(BUTTON_GROUP))).toEqual([
      catalogue("form.verified_filter.true"),
      catalogue("form.verified_filter.false"),
      catalogue("form.verified_filter.null")
    ]);
  });

  it("names both positions of the toggle group from its own key's members", async () => {
    const { column } = await shipped();

    expect(positionsOf(column(TOGGLE_GROUP))).toEqual([
      catalogue("form.bounced_filter.true"),
      catalogue("form.bounced_filter.false")
    ]);
  });

  it("announces the same names to assistive tech", async () => {
    const { column } = await shipped();

    expect(
      map(column(TOGGLE_GROUP).findAll(TOGGLE_GROUP_POSITION), node =>
        trim(node.text())
      )
    ).toEqual([
      catalogue("form.bounced_filter.true"),
      catalogue("form.bounced_filter.false")
    ]);
  });

  it("takes the member label from the catalogue, never from the schema", async () => {
    const { schema } = clientEmailQuery();
    const { column } = await shipped();

    const declared = [
      get(schema, ["properties", "filters", "properties", "bounced", "title"]),
      ...(get(schema, [
        "properties",
        "filters",
        "properties",
        "bounced",
        "properties",
        "eq",
        "enum"
      ]) as unknown[])
    ];

    const notBounced = positionAt(column(TOGGLE_GROUP), "false").text().trim();

    expect(notBounced).toBe(catalogue("form.bounced_filter.false"));
    expect(map(declared, String)).not.toContain(notBounced);
  });

  it("moves the rendered names when the element's i18n key moves", async () => {
    const { column } = await mountFilters(verifiedNamed("form.sent_filter"));

    expect(positionsOf(column(BUTTON_GROUP))).toEqual([
      catalogue("form.sent_filter.true"),
      catalogue("form.sent_filter.false"),
      catalogue("form.sent_filter.null")
    ]);
  });
});

describe("the translator is load-bearing", () => {
  it("falls back to JSON Forms' raw member names when the mount supplies none", async () => {
    const { column } = await mountFilters({
      ...clientEmailQuery(),
      translate: false
    });

    expect(positionsOf(column(TOGGLE_GROUP))).toEqual(["true", "false"]);
    expect(positionsOf(column(TOGGLE_GROUP))).not.toContain(
      catalogue("form.bounced_filter.false")
    );
  });
});

/**
 * The catalogue side of the same contract. The renderers resolve `<i18n>.label`
 * and `<i18n>.<member>` whether or not `packages/i18n` carries them; an absent
 * key silently degrades to JSON Forms' own fallback — the property name for a
 * label, the literal `"true"` / `"false"` / `"null"` for a member — which reads
 * as a rendered string and so escapes every assertion above.
 *
 * `packages/i18n` is frozen to this seat: a failure here is a REPORT of the
 * keys the shipped uischemas reference and the catalogue does not carry, not a
 * licence to add them.
 */
describe("every key the shipped uischemas reference exists in the catalogue", () => {
  const declaredElements = ({ schema, uischema }: QueryDeclaration) =>
    map((uischema as Layout).elements, element => ({
      i18n: get(element, "i18n") as string,
      scope: get(element, "scope") as string,
      schema
    }));

  const membersOf = ({
    schema,
    scope
  }: {
    schema: JsonSchema7;
    scope: string;
  }): unknown[] =>
    (
      get(schema, compact(scope.replace(/^#\//, "").split("/"))) as {
        enum?: unknown[];
      }
    )?.enum ?? [];

  // `null` is a DECLARED entry — `form.email_search.label` files "this control
  // draws no label" — so only an absent entry counts as untranslated here.
  const missingKeysFor = (declaration: QueryDeclaration) =>
    flatMap(declaredElements(declaration), element =>
      filter(
        [
          `${element.i18n}.label`,
          ...map(
            membersOf(element),
            member => `${element.i18n}.${JSON.stringify(member)}`
          )
        ],
        key => catalogue(key) === undefined
      )
    );

  it("carries every key the client-email bar renders", () => {
    expect(missingKeysFor(clientEmailQuery())).toEqual([]);
  });

  it("carries every key the client-email-history bar renders", () => {
    expect(missingKeysFor(clientEmailHistoryQuery())).toEqual([]);
  });

  it("declares an entry per element, so the report above cannot be vacuous", () => {
    expect(declaredElements(clientEmailQuery())).toHaveLength(3);
    expect(declaredElements(clientEmailHistoryQuery())).toHaveLength(3);
  });
});

describe("the sweep the no-raw-key assertion rests on", () => {
  it("sees a key that shares its element with an element child", () => {
    const wrapper = mount({
      render: () => h("label", [h("span", "Verified"), " form.verified_filter"])
    });

    expect(rawKeysIn(renderedStrings(wrapper))).toEqual([
      "form.verified_filter"
    ]);
  });
});

describe("the search box keeps the presentation its catalogue entry declares", () => {
  it("draws no label for the column its uischema marks label-less", async () => {
    const { column } = await shipped();

    expect(labelOf(column(SEARCH))).toBe("");
  });

  it("falls back to JSON Forms' OWN label once the suppression is lifted", async () => {
    const { schema, uischema } = clientEmailQuery();
    const { column } = await mountFilters({
      schema,
      uischema: uischemaWithOptions(uischema, "/email/properties/like", {
        format: "search",
        optionalText: ""
      })
    });

    expect(get(catalogue("form.email_search"), "label")).toBeNull();
    expect(labelOf(column(SEARCH))).toBe("Like");
  });
});
