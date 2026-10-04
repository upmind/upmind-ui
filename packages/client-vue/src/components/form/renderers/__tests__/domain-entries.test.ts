// -----------------------------------------------------------------------------
/**
 * @fileoverview The registry forms read carries the domain package's two entries.
 *
 * ## Job To Be Done
 * Once client-vue and domain have registered, a form hands its domain field and
 * SLD field to the domain package's own entries only.
 *
 * ## What Breaks If These Fail
 * A domain field degrades to a bare text input, or two copies claim one element.
 */

import { describe, expect, it } from "vitest";
import { domainRenderers } from "@upmind-automation/domain";
import { useFormRenderers } from "@upmind-automation/foundation";
import "../../../../index";
import { filter, indexOf, map } from "lodash-es";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const UNCLAIMED_RANK = 0;

const [domainRendererEntry, sldRendererEntry] = domainRenderers;

const SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    zzz_domain: { type: "string" },
    zzz_sld: { type: "string", format: "sld" },
    zzz_reference: { type: "string" }
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

const DOMAIN_FIELD: UISchemaElement = {
  type: "Control",
  scope: "#/properties/zzz_domain",
  options: { semantic_type: "domain_name" }
};

const SLD_FIELD: UISchemaElement = {
  type: "Control",
  scope: "#/properties/zzz_sld"
};

const PLAIN_FIELD: UISchemaElement = {
  type: "Control",
  scope: "#/properties/zzz_reference"
};

const FIELDS: Array<[string, UISchemaElement, unknown]> = [
  ["a domain field", DOMAIN_FIELD, domainRendererEntry],
  ["an SLD field", SLD_FIELD, sldRendererEntry]
];

// -----------------------------------------------------------------------------

describe("the registry forms read carries the domain renderers", () => {
  it("exports the two entries it registers", () => {
    expect(domainRenderers).toHaveLength(2);
  });

  it.each(FIELDS)(
    "hands %s to the domain package's own entry, alone",
    (_label, uischema, entry) => {
      expect(map(claimants(uischema), "entry")).toEqual([entry]);
    }
  );

  it("outranks the engine's own controls on both elements", () => {
    const engineEnumRank = 2;

    for (const [label, uischema] of FIELDS) {
      const claimed = claimants(uischema);

      expect(claimed.length, `${label} has no claimant`).toBeGreaterThan(0);
      for (const scored of claimed) {
        expect(scored.rank, `${label} is claimed too weakly`).toBeGreaterThan(
          engineEnumRank
        );
      }
    }
  });

  it("leaves a plain control to the engine, so no tester claims too much", () => {
    expect(claimants(PLAIN_FIELD)).toEqual([]);
  });

  it("registers the two together, in the order that package exports them", () => {
    const registry = useFormRenderers().renderers.value;
    const positions = map([domainRendererEntry, sldRendererEntry], entry =>
      indexOf(registry, entry)
    );

    expect(
      positions,
      `an entry the domain package exports is not registered at all`
    ).not.toContain(-1);
    expect(positions).toEqual([positions[0], positions[0] + 1]);
  });
});
