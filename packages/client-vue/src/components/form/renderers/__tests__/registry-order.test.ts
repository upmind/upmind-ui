// -----------------------------------------------------------------------------
/**
 * @fileoverview The registry's slot sequence, against develop's.
 *
 * ## Job To Be Done
 * Foundation's list takes the slot develop gives the lookup control, the domain
 * package registers its own pair, and every other control keeps the position it
 * holds on develop.
 *
 * ## What Breaks If These Fail
 * A renderer's slot goes to its neighbour, so the terms selector draws a gateway picker.
 */

import { describe, expect, it } from "vitest";
import { foundationRenderers } from "@upmind-automation/foundation";
import { formRenderers } from "../index";
import { concat, difference, get, indexOf, map, slice } from "lodash-es";
import type { FormRendererEntry } from "@upmind-automation/foundation";

// -----------------------------------------------------------------------------

const DEVELOP = [
  "DomainRenderer",
  "SLDRenderer",
  "ImageRenderer",
  "LookupRenderer",
  "FilterButtonGroupRenderer",
  "FilterExclusiveToggleGroupRenderer",
  "FilterToggleGroupRenderer",
  "EnumToggleGroupRenderer",
  "FilterSearchRenderer",
  "FilterMultiSelectRenderer",
  "FilterRangeRenderer",
  "FilterBarRenderer"
];

const MOVED_TO_FOUNDATION = "LookupRenderer";

const MOVED_TO_THE_DOMAIN_PACKAGE = ["DomainRenderer", "SLDRenderer"];

const KEPT = difference(DEVELOP, MOVED_TO_THE_DOMAIN_PACKAGE);
const FOUNDATION_SLOT = indexOf(KEPT, MOVED_TO_FOUNDATION);

function namesOf(entries: FormRendererEntry[]): string[] {
  return map(entries, entry => get(entry.renderer, "__name"));
}

const foundationNames = namesOf(foundationRenderers);
const expected = concat(
  slice(KEPT, 0, FOUNDATION_SLOT),
  foundationNames,
  slice(KEPT, FOUNDATION_SLOT + 1)
);
const now = namesOf(formRenderers);

// -----------------------------------------------------------------------------

describe("the registry's slot sequence", () => {
  it("carries the lookup control in foundation's list, so the claims below are not vacuous", () => {
    expect(foundationNames).toContain(MOVED_TO_FOUNDATION);
  });

  it.each(MOVED_TO_THE_DOMAIN_PACKAGE)(
    "leaves %s, which develop registers here, to the domain package",
    name => {
      expect(DEVELOP).toContain(name);
      expect(now).not.toContain(name);
    }
  );

  it("keeps develop's sequence, with foundation's list in the lookup control's slot", () => {
    expect(now).toEqual(expected);
  });

  it.each(map(expected, (slot, index) => ({ slot, index })))(
    "keeps $slot at position $index",
    ({ slot, index }) => {
      expect(now[index]).toBe(slot);
    }
  );

  it.each(
    map(foundationRenderers, (entry, offset) => ({
      entry,
      offset,
      name: foundationNames[offset]
    }))
  )(
    "hands on foundation's own $name entry, not a copy",
    ({ entry, offset }) => {
      expect(formRenderers[FOUNDATION_SLOT + offset]).toBe(entry);
    }
  );
});
