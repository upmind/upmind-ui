// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/client-custom-fields-declaration.spec
 * @description The client-custom-fields scenario's DECLARATION claims — the
 * declaration draws only what it declares. The generic runtime surfaces already
 * prove the machinery; a new page adds declaration-level claims so it never
 * re-tests the renderer.
 *
 * Three claims:
 *   1. the declaration names at least ONE of `useList` / `useMutate` — the law
 *      the contract cannot express while `useList` is required outright, so the
 *      spec is what fails a declaration naming neither;
 *   2. it declares no route — the url segment and the route name are the
 *      declaring DIRECTORY's, attached by the registry, so a declaration cannot
 *      misname its own url;
 *   3. every table element names a real cell RENDERER and carries only `scope`
 *      and `i18n` — no options-discriminator, no cell enum.
 *
 * VIEW-ONLY: this module has `useList` only, no `useMutate` (no manager).
 */

import { describe, expect, it } from "vitest";
import { registry } from "../runtime/registry";
import clientCustomFields from "../useClientCustomFields/client-custom-fields.scenario";
import { difference, get, has, keys, map, reject, startsWith } from "lodash-es";

// -----------------------------------------------------------------------------

const SCENARIO_DIRECTORY = "useClientCustomFields";
const CELL_ELEMENT_KEYS = ["type", "scope", "i18n", "options"];

// -----------------------------------------------------------------------------

describe("@client-custom-fields the declaration draws only what it declares", () => {
  it("names at least one of useList / useMutate", () => {
    expect(
      has(clientCustomFields, "useList") || has(clientCustomFields, "useMutate")
    ).toBe(true);
  });

  it("declares no route — the registry attaches the directory", () => {
    expect(has(clientCustomFields, "route")).toBe(false);
    expect(get(registry, [clientCustomFields.key, "route"])).toBe(
      SCENARIO_DIRECTORY
    );
  });

  it("draws every column through a registered cell renderer", () => {
    const elements = get(
      clientCustomFields,
      ["presentation", "table", "elements"],
      []
    );
    const unregistered = reject(elements, element =>
      startsWith(element.type, "TableCell")
    );

    expect(
      map(unregistered, "type"),
      "Element type(s) naming no cell renderer"
    ).toEqual([]);
    expect(
      map(elements, element => difference(keys(element), CELL_ELEMENT_KEYS)),
      "Element channel(s) beyond scope + i18n"
    ).toEqual(map(elements, () => []));
  });
});
