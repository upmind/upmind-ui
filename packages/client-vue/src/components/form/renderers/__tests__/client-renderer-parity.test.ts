// -----------------------------------------------------------------------------
/**
 * @fileoverview The registry forms read survives each extraction.
 *
 * ## Job To Be Done
 * Once client-vue and client have registered, the moved `Address` and `Manage`
 * entries claim their elements alone, at the rank consumers read, the filter
 * and image controls stay registered here, and the lookup control arrives
 * once, through foundation's own list.
 *
 * ## What Breaks If These Fail
 * An address field renders as bare text inputs, or a collection panel never renders.
 */

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { clientRenderers } from "@upmind-automation/client";
import {
  foundationRenderers,
  useFormRenderers
} from "@upmind-automation/foundation";
import { formRenderers } from "../index";
import "../../../../index";
import { concat, filter, get, map, size, sortBy } from "lodash-es";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const RENDERERS_DIR = resolve(import.meta.dirname, "..");

const ADDRESS_RANK = 2;
const MANAGE_RANK = 4;

const UNCLAIMED_RANK = 0;

const KEPT_HERE = [
  "FilterBarRenderer",
  "FilterButtonGroupRenderer",
  "FilterToggleGroupRenderer",
  "FilterSearchRenderer",
  "FilterMultiSelectRenderer",
  "FilterRangeRenderer",
  "ImageRenderer"
];

const MOVED_TO_FOUNDATION = ["LookupRenderer"];

const MOVED_EARLIER = ["AddressRenderer", "ManageRenderer"];

const MOVED_TO_THE_DOMAIN_PACKAGE = ["DomainRenderer", "SLDRenderer"];

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

function registeredNames() {
  return map(useFormRenderers().renderers.value, entry =>
    get(entry.renderer, "__name")
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

  it.each(KEPT_HERE)("still registers %s, as develop does", name => {
    expect(registeredNames()).toContain(name);
  });

  it.each(MOVED_TO_FOUNDATION)(
    "registers %s once, through foundation's list",
    name => {
      expect(
        filter(registeredNames(), registered => registered === name)
      ).toEqual([name]);
    }
  );

  it.each(
    map(foundationRenderers, entry => ({
      entry,
      name: get(entry.renderer, "__name")
    }))
  )("registers foundation's own $name entry, once", ({ entry }) => {
    expect(
      size(
        filter(
          useFormRenderers().renderers.value,
          registered => registered === entry
        )
      )
    ).toBe(1);
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
});

describe("a move, not a copy", () => {
  it.each(
    concat(MOVED_EARLIER, MOVED_TO_FOUNDATION, MOVED_TO_THE_DOMAIN_PACKAGE)
  )("leaves no %s.vue behind to drift from the moved one", name => {
    const left = readdirSync(RENDERERS_DIR).filter(
      entry => entry === `${name}.vue`
    );

    expect(
      left,
      "a second copy of this renderer still ships from the package it moved out of"
    ).toEqual([]);
  });

  it("reads a real renderers directory, and a registry that is not empty", () => {
    const listed = readdirSync(RENDERERS_DIR);

    expect(
      listed,
      "the sweep above is reading a directory with nothing in it, so it would " +
        "pass whatever this package shipped"
    ).not.toEqual([]);
    expect(listed).toContain("index.ts");
    expect(useFormRenderers().renderers.value.length).toBeGreaterThan(0);
  });

  const KEPT_LOCAL = sortBy(
    map(
      concat(
        ["EnumToggleGroupRenderer", "FilterExclusiveToggleGroupRenderer"],
        KEPT_HERE
      ),
      name => `${name}.vue`
    )
  );

  it("defines no renderer component of its own, bar the ones named", () => {
    const own = sortBy(
      readdirSync(RENDERERS_DIR).filter(entry => entry.endsWith(".vue"))
    );

    expect(
      own,
      `this package defines renderer components again, so the registry it ` +
        `binds forks from the packages that own them: ${own.join(", ")}`
    ).toEqual(KEPT_LOCAL);
  });

  it.each(KEPT_LOCAL)(
    "still ships %s, so the line above is not vacuous",
    name => {
      expect(readdirSync(RENDERERS_DIR)).toContain(name);
    }
  );
});
