// -----------------------------------------------------------------------------
/**
 * @fileoverview The client domain renderers claim their elements at their ranks
 *
 * ## Job To Be Done
 * Drive each tester against its own element, its sibling's element and the shapes it refuses.
 *
 * ## What Breaks If These Fail
 * An address renders as bare text inputs, or a collection panel never renders.
 */

import { describe, expect, it } from "vitest";
import { clientRenderers } from "../index";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const ADDRESS = 0;
const MANAGE = 1;

const ADDRESS_RANK = 2;
const MANAGE_RANK = 4;

const SCHEMA = {
  type: "object",
  properties: {
    address: { type: "object" },
    addresses: { type: "array" },
    reference: { type: "string" }
  }
} satisfies JsonSchema;

function element(shape: object): UISchemaElement {
  return shape as UISchemaElement;
}

function layout(type: string): UISchemaElement {
  return element({ type, elements: [] });
}

function control(type: string, property: string): UISchemaElement {
  return element({ type, scope: `#/properties/${property}` });
}

function rankFor(index: number, uischema: UISchemaElement, schema = SCHEMA) {
  const entry = clientRenderers[index];
  if (!entry) throw new Error(`no renderer entry at index ${index}`);
  return entry.tester(uischema, schema as JsonSchema, {
    rootSchema: schema as JsonSchema,
    config: {}
  });
}

function claimants(uischema: UISchemaElement) {
  return clientRenderers
    .map((_, index) => rankFor(index, uischema))
    .map((rank, index) => ({ index, rank }))
    .filter(entry => entry.rank > -1)
    .map(entry => entry.index);
}

// -----------------------------------------------------------------------------

describe("the client renderer entries", () => {
  it("registers exactly two", () => {
    expect(clientRenderers).toHaveLength(2);
  });

  it("registers each in the shape the form engine accepts", () => {
    for (const entry of clientRenderers) {
      expect(Object.keys(entry).sort()).toEqual(["renderer", "tester"]);
      expect(entry.renderer).toBeTruthy();
      expect(typeof entry.tester).toBe("function");
    }
  });

  it("claims an address LAYOUT for the address renderer", () => {
    expect(rankFor(ADDRESS, layout("address"))).toBe(ADDRESS_RANK);
  });

  it("refuses an address-typed control, which is a field and not the block", () => {
    expect(rankFor(ADDRESS, control("address", "address"))).toBe(-1);
  });

  it("claims the Manager element for the manage renderer", () => {
    expect(rankFor(MANAGE, control("Manager", "addresses"))).toBe(MANAGE_RANK);
  });

  it("claims a Manager layout for the manage renderer too", () => {
    expect(rankFor(MANAGE, layout("Manager"))).toBe(MANAGE_RANK);
  });

  it("keeps each renderer off its sibling's elements", () => {
    expect(claimants(layout("address"))).toEqual([ADDRESS]);
    expect(claimants(control("Manager", "addresses"))).toEqual([MANAGE]);
  });

  it("leaves a plain control to the engine's own controls", () => {
    expect(claimants(control("Control", "reference"))).toEqual([]);
  });

  it("refuses an ordinary layout that merely contains the elements", () => {
    const vertical = element({
      type: "VerticalLayout",
      elements: [layout("address"), control("Manager", "addresses")]
    });

    expect(claimants(vertical)).toEqual([]);
  });

  it("outranks the engine's own array control on a Manager element", () => {
    const engineArrayRank = 3;

    expect(rankFor(MANAGE, control("Manager", "addresses"))).toBeGreaterThan(
      engineArrayRank
    );
  });

  it("registers the renderers as components, not as bare names", () => {
    for (const entry of clientRenderers) {
      const renderer: unknown = entry.renderer;
      expect(
        typeof renderer === "object" || typeof renderer === "function"
      ).toBe(true);
    }
  });

  it("gives each of the two a distinct renderer", () => {
    const renderers = clientRenderers.map(entry => entry.renderer);

    expect(new Set(renderers).size).toBe(2);
  });
});
