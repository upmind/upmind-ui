// -----------------------------------------------------------------------------
/**
 * @fileoverview The registry forms read survives the client extraction.
 *
 * ## Job To Be Done
 * Once client-vue and client have registered, the moved `Address` and `Manage`
 * entries claim their elements alone, at the rank consumers read.
 *
 * ## What Breaks If These Fail
 * An address field renders as bare text inputs, or a collection panel never renders.
 */

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { clientRenderers } from "@upmind-automation/client";
import { useFormRenderers } from "@upmind-automation/foundation";
import { formRenderers } from "../index";
import "../../../../index";
import { concat, filter, map } from "lodash-es";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const RENDERERS_DIR = resolve(import.meta.dirname, "..");

const ADDRESS_RANK = 2;
const MANAGE_RANK = 4;

const UNCLAIMED_RANK = 0;

const MOVED_FILES = ["AddressRenderer.vue", "ManageRenderer.vue"];

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    address: { type: "object" },
    addresses: { type: "array" }
  }
};

function claimants(uischema: UISchemaElement) {
  return filter(
    map(useFormRenderers().renderers.value, entry => ({
      entry,
      rank: entry.tester(uischema, SCHEMA, { rootSchema: SCHEMA, config: {} })
    })),
    scored => scored.rank > UNCLAIMED_RANK
  );
}

const ADDRESS_BLOCK: UISchemaElement = { type: "address", elements: [] };
const MANAGER: UISchemaElement = {
  type: "Manager",
  scope: "#/properties/addresses"
};

// -----------------------------------------------------------------------------

describe("the form registry after the client renderers moved out", () => {
  it("loses no entry to the move", () => {
    expect(useFormRenderers().renderers.value).toEqual(
      expect.arrayContaining(concat(formRenderers, clientRenderers))
    );
  });

  it("registers every one of them in the shape the engine accepts", () => {
    for (const entry of useFormRenderers().renderers.value) {
      expect(typeof entry.tester).toBe("function");
      expect(entry.renderer).toBeTruthy();
    }
  });

  it("hands the address block to one client entry alone, at the rank it always had", () => {
    const [claim, ...others] = claimants(ADDRESS_BLOCK);

    expect(others).toEqual([]);
    expect(clientRenderers).toContain(claim?.entry);
    expect(claim?.rank).toBe(ADDRESS_RANK);
  });

  it("hands the manage panel to one client entry alone, at the rank it always had", () => {
    const [claim, ...others] = claimants(MANAGER);

    expect(others).toEqual([]);
    expect(clientRenderers).toContain(claim?.entry);
    expect(claim?.rank).toBe(MANAGE_RANK);
  });

  it("keeps the manage panel ahead of the engine's array control", () => {
    const [claim] = claimants(MANAGER);

    expect(claim?.rank).toBeGreaterThan(3);
  });

  it.each(MOVED_FILES)(
    "leaves no %s behind to drift from the moved one",
    file => {
      const left = readdirSync(RENDERERS_DIR).filter(entry => entry === file);

      expect(
        left,
        `a second copy of this renderer still ships from the package it moved out of`
      ).toEqual([]);
    }
  );

  it("keeps the renderers this package still owns", () => {
    const own = readdirSync(RENDERERS_DIR).filter(entry =>
      entry.endsWith("Renderer.vue")
    );

    expect(
      own.length,
      "every renderer left this package, so the registry above can only be " +
        "reading entries nothing in this tree defines"
    ).toBeGreaterThan(0);
  });
});
