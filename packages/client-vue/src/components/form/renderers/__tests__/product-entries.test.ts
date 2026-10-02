// -----------------------------------------------------------------------------
/**
 * @module form/renderers/__tests__/product-entries
 * @description The registry forms read hands the product package's elements to its own entries.
 *
 * ## Job To Be Done
 * Once client-vue and product have registered, `Terms` and `SubProducts` go to the product renderers, and no client-vue control claims them.
 *
 * ## What Breaks If These Fail
 * A terms selector degrades to a bare enum and a subproduct group to a raw array control.
 */

import { describe, expect, it } from "vitest";
import { useFormRenderers } from "@upmind-automation/foundation";
import { productRenderers } from "@upmind-automation/product";
import "../../../../index";
import { filter, map, size } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

const [termsRendererEntry, subProductRendererEntry] = productRenderers;

const UNCLAIMED_RANK = 0;

const CHOICE_RANK = 5;

const SCHEMA: JsonSchema7 = {
  type: "object",
  properties: {
    zzz_term: { type: "number" },
    zzz_addons: { type: "object" },
    zzz_reference: { type: "string" }
  }
};

const element = (type: string, property: string): UISchemaElement => ({
  type,
  scope: `#/properties/${property}`
});

const claimants = (uischema: UISchemaElement) =>
  filter(
    map(useFormRenderers().renderers.value, entry => ({
      entry,
      rank: entry.tester(uischema, SCHEMA, { rootSchema: SCHEMA, config: {} })
    })),
    scored => scored.rank > UNCLAIMED_RANK
  );

const TERMS = element("Terms", "zzz_term");
const SUBPRODUCTS = element("SubProducts", "zzz_addons");

// -----------------------------------------------------------------------------

describe("the registry forms read, once client-vue and product have registered", () => {
  it("holds more than product's own entries, so client-vue's controls compete too", () => {
    expect(size(useFormRenderers().renderers.value)).toBeGreaterThan(
      size(productRenderers)
    );
  });

  it("hands a Terms element to the product package's own terms entry, alone", () => {
    expect(claimants(TERMS)).toEqual([
      { entry: termsRendererEntry, rank: CHOICE_RANK }
    ]);
  });

  it("hands a SubProducts element to the product package's own subproduct entry, alone", () => {
    expect(claimants(SUBPRODUCTS)).toEqual([
      { entry: subProductRendererEntry, rank: CHOICE_RANK }
    ]);
  });

  it("outranks the engine's own controls on both elements", () => {
    const engineArrayRank = 3;

    for (const claimed of [...claimants(TERMS), ...claimants(SUBPRODUCTS)]) {
      expect(claimed.rank).toBeGreaterThan(engineArrayRank);
    }
  });

  it("leaves a plain control to the engine, so neither tester claims too much", () => {
    expect(claimants(element("Control", "zzz_reference"))).toEqual([]);
  });
});
