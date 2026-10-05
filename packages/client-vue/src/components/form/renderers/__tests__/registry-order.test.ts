// -----------------------------------------------------------------------------
/**
 * @fileoverview The registry's slot sequence, against the one it held before the move.
 *
 * ## Job To Be Done
 * Only the moved slots change, and the packages that register their own controls
 * (domain among them) leave the list; every other slot keeps its position.
 *
 * ## What Breaks If These Fail
 * A renderer's slot goes to its neighbour, so the terms selector draws a gateway picker.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { concat, difference, intersection } from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(import.meta.dirname, "../../../../../../..");
const REGISTRY_PATH =
  "packages/client-vue/src/components/form/renderers/index.ts";

const before = [
  "DomainRenderer",
  "SLDRenderer",
  "...clientRenderers",
  "ImageRenderer",
  "LookupRenderer",
  "...paymentRenderers",
  "...productRenderers",
  "FilterButtonGroupRenderer",
  "FilterExclusiveToggleGroupRenderer",
  "FilterToggleGroupRenderer",
  "EnumToggleGroupRenderer",
  "FilterSearchRenderer",
  "FilterMultiSelectRenderer",
  "FilterRangeRenderer",
  "FilterBarRenderer"
];

const MOVED_TO_FOUNDATION = [
  "LookupRenderer",
  "ImageRenderer",
  "FilterButtonGroupRenderer",
  "FilterExclusiveToggleGroupRenderer",
  "FilterToggleGroupRenderer",
  "FilterSearchRenderer",
  "FilterMultiSelectRenderer",
  "FilterRangeRenderer",
  "FilterBarRenderer"
];

const REPLACED_BY_THE_DOMAIN_MOVE = ["DomainRenderer", "SLDRenderer"];

const DOMAIN_SET = "...domainRenderers";

const REGISTERED_BY_THEIR_PACKAGE = [
  "...clientRenderers",
  "...paymentRenderers",
  "...productRenderers"
];

const LEFT_THE_LIST = concat(
  MOVED_TO_FOUNDATION,
  REPLACED_BY_THE_DOMAIN_MOVE,
  REGISTERED_BY_THEIR_PACKAGE
);

const ARRAY_BLOCK = /export const formRenderers\s*=\s*\[([\s\S]*?)\n\]/;
const SPREAD = /^\.\.\.([A-Za-z0-9_$]+)$/;
const CALL = /^registerEntry\(\s*([A-Za-z0-9_$]+)/;
const PLAIN = /^([A-Za-z0-9_$]+)$/;

/** Splits on the commas between slots, not those inside a `registerEntry(...)` call. */
function topLevelEntries(block: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of block) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      entries.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  entries.push(current);

  return entries;
}

function slotsIn(source: string): string[] {
  const block = ARRAY_BLOCK.exec(source);
  if (!block) throw new Error("no formRenderers array literal found");

  return topLevelEntries(block[1].replace(/\/\/.*$/gm, ""))
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(line => {
      const spread = SPREAD.exec(line);
      if (spread) return `...${spread[1]}`;
      const call = CALL.exec(line);
      if (call) return call[1];
      const plain = PLAIN.exec(line);
      if (plain) return plain[1];
      throw new Error(`unreadable registry slot: ${line}`);
    });
}

const now = slotsIn(readFileSync(resolve(REPO_ROOT, REGISTRY_PATH), "utf8"));

const expected = difference(before, LEFT_THE_LIST);

// -----------------------------------------------------------------------------

describe("the registry's slot sequence", () => {
  it.each(MOVED_TO_FOUNDATION)(
    "carried %s before the move, so the claim below is not vacuous",
    name => {
      expect(before).toContain(name);
    }
  );

  it.each(MOVED_TO_FOUNDATION)("registers %s no longer", name => {
    expect(now).not.toContain(name);
  });

  it.each(REPLACED_BY_THE_DOMAIN_MOVE)(
    "carried %s before the domain move, so the claim below is not vacuous",
    name => {
      expect(before).toContain(name);
    }
  );

  it.each(REPLACED_BY_THE_DOMAIN_MOVE)(
    "leaves %s to the domain package, which registers its own set",
    component => {
      expect(now).not.toContain(component);
      expect(now).not.toContain(DOMAIN_SET);
    }
  );

  it("adds nothing", () => {
    const added = difference(now, expected);

    expect(
      added,
      `slots nobody declared appeared in the registry: ${added.join(", ")}`
    ).toEqual([]);
  });

  it("keeps every slot in the position this phase entitles it to", () => {
    expect(now).toEqual(expected);
  });

  it.each(expected.map((slot, index) => ({ slot, index })))(
    "keeps $slot at position $index",
    ({ slot, index }) => {
      expect(now[index]).toBe(slot);
    }
  );

  it.each(REGISTERED_BY_THEIR_PACKAGE)(
    "leaves %s to the package that registers it",
    slot => {
      expect(before).toContain(slot);
      expect(now).not.toContain(slot);
    }
  );

  it("takes exactly the moved controls, the domain pair and the self-registering packages, and nothing else", () => {
    expect(difference(before, now)).toEqual(
      intersection(before, LEFT_THE_LIST)
    );
  });

  it("leaves every untouched slot exactly where it was", () => {
    expect(expected.length).toBeGreaterThan(0);

    for (const slot of expected) {
      expect(now.indexOf(slot), `${slot} moved`).toBe(expected.indexOf(slot));
    }
  });

  it("names no file either move deleted", () => {
    const source = readFileSync(resolve(REPO_ROOT, REGISTRY_PATH), "utf8");

    for (const name of concat(
      MOVED_TO_FOUNDATION,
      REPLACED_BY_THE_DOMAIN_MOVE
    )) {
      expect(source).not.toContain(`./${name}.vue`);
    }
  });
});
