// -----------------------------------------------------------------------------
/**
 * @fileoverview The two domain renderer entries.
 *
 * ## Job To Be Done
 * Each tester claims its own control, leaves its siblings' alone and refuses generic shapes.
 *
 * ## What Breaks If These Fail
 * A domain field falls back to a bare text input, or domain search paints over another control.
 */

import { describe, expect, it } from "vitest";
import { domainRenderers } from "../index";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const DOMAIN = 0;
const SLD = 1;

const NOT_APPLICABLE = -1;

const RETIRED_DAC_UI_TYPE = "Dac";

const SCHEMA = {
  type: "object",
  properties: {
    zzz_domain: { type: "string" },
    zzz_sld: { type: "string", format: "sld" },
    zzz_reference: { type: "string" }
  }
} satisfies JsonSchema;

const FILE_SCHEMA = {
  type: "object",
  properties: { zzz_logo: { type: "string", format: "file" } }
} satisfies JsonSchema;

function control(property: string, extra: object = {}): UISchemaElement {
  const element = {
    type: "Control",
    scope: `#/properties/${property}`,
    ...extra
  };
  return element as UISchemaElement;
}

function rankFor(index: number, uischema: UISchemaElement, schema = SCHEMA) {
  const entry = domainRenderers[index];
  if (!entry) throw new Error(`no renderer entry at index ${index}`);
  return entry.tester(uischema, schema as JsonSchema, {
    rootSchema: schema as JsonSchema,
    config: {}
  });
}

function claimants(uischema: UISchemaElement, schema = SCHEMA) {
  return domainRenderers
    .map((_, index) => ({ index, rank: rankFor(index, uischema, schema) }))
    .filter(entry => entry.rank > NOT_APPLICABLE)
    .map(entry => entry.index);
}

const DOMAIN_CONTROL = control("zzz_domain", {
  options: { semantic_type: "domain_name" }
});
const SLD_CONTROL = control("zzz_sld");
const RETIRED_DAC_CONTROL = { type: RETIRED_DAC_UI_TYPE } as UISchemaElement;

const WRONG_CASE_SLD_SCHEMA = {
  type: "object",
  properties: { zzz_sld: { type: "string", format: "SLD" } }
} satisfies JsonSchema;

const GENERIC_CONTROLS: [string, UISchemaElement, JsonSchema][] = [
  [
    "an image-option control",
    control("zzz_logo", { options: { type: "image" } }),
    SCHEMA
  ],
  ["a file-format control", control("zzz_logo"), FILE_SCHEMA],
  ["a bare string control", control("zzz_reference"), SCHEMA],
  [
    "a text-option control",
    control("zzz_reference", { options: { type: "text" } }),
    SCHEMA
  ]
];

// -----------------------------------------------------------------------------

describe("the domain renderer entries", () => {
  it("registers exactly two, in the order a positional consumer reads", () => {
    expect(domainRenderers).toHaveLength(2);

    for (const entry of domainRenderers) {
      expect(Object.keys(entry).sort()).toEqual(["renderer", "tester"]);
      expect(entry.renderer).toBeTruthy();
      expect(typeof entry.tester).toBe("function");
    }
  });

  it("claims the domain field for the domain renderer", () => {
    expect(rankFor(DOMAIN, DOMAIN_CONTROL)).toBeGreaterThan(NOT_APPLICABLE);
  });

  it("claims the SLD field for the SLD renderer", () => {
    expect(rankFor(SLD, SLD_CONTROL)).toBeGreaterThan(NOT_APPLICABLE);
  });

  it("leaves an unformatted field, and a wrong-cased one, to the engine", () => {
    expect(rankFor(SLD, control("zzz_reference"))).toBe(NOT_APPLICABLE);
    expect(rankFor(SLD, control("zzz_sld"), WRONG_CASE_SLD_SCHEMA)).toBe(
      NOT_APPLICABLE
    );
  });

  it("claims no `Dac` element, now the catalogue loads the widget itself", () => {
    expect(claimants(RETIRED_DAC_CONTROL)).toEqual([]);
  });

  it("keeps each renderer off its siblings' element", () => {
    expect(claimants(DOMAIN_CONTROL)).toEqual([DOMAIN]);
    expect(claimants(SLD_CONTROL)).toEqual([SLD]);
  });

  it("leaves a plain control to the engine's own controls", () => {
    expect(claimants(control("zzz_reference"))).toEqual([]);
  });

  it("claims nothing for a generic file-format or image-option control", () => {
    expect(
      domainRenderers.length,
      "an empty set refuses every control vacuously"
    ).toBeGreaterThan(0);

    for (const [label, uischema, schema] of GENERIC_CONTROLS) {
      expect(
        claimants(uischema, schema),
        `a domain renderer claimed ${label}, which is the design system's`
      ).toEqual([]);
    }
  });

  it("refuses a layout that merely contains the element", () => {
    const layout = {
      type: "VerticalLayout",
      elements: [DOMAIN_CONTROL, SLD_CONTROL]
    } as UISchemaElement;

    expect(claimants(layout)).toEqual([]);
  });

  it("outranks the engine's own controls on every element it claims", () => {
    const engineEnumRank = 2;

    expect(rankFor(DOMAIN, DOMAIN_CONTROL)).toBeGreaterThan(engineEnumRank);
    expect(rankFor(SLD, SLD_CONTROL)).toBeGreaterThan(engineEnumRank);
  });

  it("registers the renderers as components, not as bare names", () => {
    for (const entry of domainRenderers) {
      const renderer = entry.renderer as unknown;

      expect(
        typeof renderer === "object" || typeof renderer === "function"
      ).toBe(true);
    }
  });

  it("gives each of the two a distinct renderer", () => {
    const renderers = domainRenderers.map(entry => entry.renderer);

    expect(new Set(renderers).size).toBe(domainRenderers.length);
  });
});
