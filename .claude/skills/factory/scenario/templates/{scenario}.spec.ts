// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the one built page it
 * cites. Authority:
 * `playgrounds/labs-nuxt/modules/scenarios/runtime/scenario.types.ts`
 * and this set's `CHANNELS.md`. A disagreement between the skeleton, the
 * reference specs and the contract is a surfaced finding, never silently
 * resolved toward either.
 *
 * Emitted by the PROVER seat into
 * `playgrounds/labs-nuxt/modules/scenarios/__tests__/`.
 */

import { describe, expect, it } from "vitest";
import { difference, get, has, keys, map, reject, startsWith } from "lodash-es";
import { registry } from "../runtime/registry";
import modules from "../useModules/module.scenario";

// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/modules-declaration.spec
 * @description <T-id> — the DECLARATION's own claims, and only those. The
 * generic runtime surfaces already prove the machinery; a new page adds
 * declaration-level claims so it never re-tests the renderer.
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
 * ## What Breaks If These Fail
 * The page draws something the module never published — a control with no
 * composable behind it, a url two surfaces disagree about, or a cell whose
 * renderer is chosen by a discriminator the registered testers never see.
 *
 * Negative controls: `modules-declaration.binding.must-fail.patch`.
 *
 * @reference `playgrounds/labs-nuxt/modules/scenarios/__tests__/` — the built
 * declaration specs, read while authoring, never a match target.
 */

/** The declaring directory — the url segment AND the route name. */
const SCENARIO_DIRECTORY = "useModules";

const CELL_ELEMENT_KEYS = ["type", "scope", "i18n"];

// -----------------------------------------------------------------------------

describe("@<TAG> the declaration draws only what it declares", () => {
  it("names at least one of useList / useMutate", () => {
    expect(has(modules, "useList") || has(modules, "useMutate")).toBe(true);
  });

  it("declares no route — the registry attaches the directory", () => {
    expect(has(modules, "route")).toBe(false);
    expect(get(registry, [modules.key, "route"])).toBe(SCENARIO_DIRECTORY);
  });

  it("draws every column through a registered cell renderer", () => {
    const elements = get(modules, ["presentation", "table", "elements"], []);
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
