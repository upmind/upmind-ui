// -----------------------------------------------------------------------------
/**
 * @fileoverview The product domain renderers
 *
 * ## Job To Be Done
 * Each tester claims its own control, leaves its sibling's, and refuses generic file and image controls.
 *
 * ## What Breaks If These Fail
 * A customer cannot choose a billing term, or the subproduct selector paints over an unrelated control.
 */

import { describe, expect, it } from "vitest";
import { productRenderers } from "../index";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const TERMS = 0;
const SUBPRODUCT = 1;

const CHOICE_RANK = 5;

const SCHEMA = {
  type: "object",
  properties: {
    logo: { type: "string" },
    term: { type: "string" },
    addons: { type: "array" },
    reference: { type: "string" }
  }
} satisfies JsonSchema;

const FILE_SCHEMA = {
  type: "object",
  properties: { logo: { type: "string", format: "file" } }
} satisfies JsonSchema;

function control(property: string, extra: object = {}): UISchemaElement {
  const element = {
    type: "Control",
    scope: `#/properties/${property}`,
    ...extra
  };
  return element as UISchemaElement;
}

function uiType(type: string, property: string): UISchemaElement {
  const element = { type, scope: `#/properties/${property}` };
  return element as UISchemaElement;
}

function rankFor(index: number, uischema: UISchemaElement, schema = SCHEMA) {
  const entry = productRenderers[index];
  if (!entry) throw new Error(`no renderer entry at index ${index}`);
  return entry.tester(uischema, schema as JsonSchema, {
    rootSchema: schema as JsonSchema,
    config: {}
  });
}

function claimants(uischema: UISchemaElement, schema = SCHEMA) {
  return productRenderers
    .map((_, index) => rankFor(index, uischema, schema))
    .map((rank, index) => ({ index, rank }))
    .filter(entry => entry.rank > -1)
    .map(entry => entry.index);
}

const GENERIC_CONTROLS: [string, UISchemaElement, JsonSchema][] = [
  [
    "an image-option control",
    control("logo", { options: { type: "image" } }),
    SCHEMA
  ],
  ["a file-format control", control("logo"), FILE_SCHEMA],
  ["a bare string control", control("logo"), SCHEMA],
  [
    "a text-option control",
    control("logo", { options: { type: "text" } }),
    SCHEMA
  ]
];

// -----------------------------------------------------------------------------

describe("the product renderer entries", () => {
  it("registers exactly two, in the order a positional consumer reads", () => {
    expect(productRenderers).toHaveLength(2);
    for (const entry of productRenderers) {
      expect(Object.keys(entry).sort()).toEqual(["renderer", "tester"]);
      expect(entry.renderer).toBeTruthy();
      expect(typeof entry.tester).toBe("function");
    }
  });

  it("claims the Terms element for the terms renderer", () => {
    expect(rankFor(TERMS, uiType("Terms", "term"))).toBe(CHOICE_RANK);
  });

  it("claims the SubProducts element for the subproduct renderer", () => {
    expect(rankFor(SUBPRODUCT, uiType("SubProducts", "addons"))).toBe(
      CHOICE_RANK
    );
  });

  it("keeps each renderer off its sibling's element", () => {
    expect(claimants(uiType("Terms", "term"))).toEqual([TERMS]);
    expect(claimants(uiType("SubProducts", "addons"))).toEqual([SUBPRODUCT]);
  });

  it("leaves a plain control to the engine's own controls", () => {
    expect(claimants(control("reference"))).toEqual([]);
  });

  it("claims nothing for a generic file-format or image-option control", () => {
    expect(
      productRenderers.length,
      "an empty set refuses every control vacuously"
    ).toBeGreaterThan(0);

    for (const [label, uischema, schema] of GENERIC_CONTROLS) {
      expect(
        claimants(uischema, schema),
        `a product renderer claimed ${label}, which is the design system's`
      ).toEqual([]);
    }
  });

  it("refuses a layout that merely contains the element", () => {
    const layout = {
      type: "VerticalLayout",
      elements: [uiType("Terms", "term"), uiType("SubProducts", "addons")]
    } as UISchemaElement;

    expect(claimants(layout)).toEqual([]);
  });

  it("outranks the engine's own controls on the two choice elements", () => {
    const engineArrayRank = 3;

    expect(rankFor(TERMS, uiType("Terms", "term"))).toBeGreaterThan(
      engineArrayRank
    );
    expect(
      rankFor(SUBPRODUCT, uiType("SubProducts", "addons"))
    ).toBeGreaterThan(engineArrayRank);
  });

  it("registers the renderers as components, not as bare names", () => {
    for (const entry of productRenderers) {
      const renderer = entry.renderer as unknown;
      expect(
        typeof renderer === "object" || typeof renderer === "function"
      ).toBe(true);
    }
  });

  it("gives each of the two a distinct renderer", () => {
    const renderers = productRenderers.map(entry => entry.renderer);

    expect(new Set(renderers).size).toBe(productRenderers.length);
  });
});
