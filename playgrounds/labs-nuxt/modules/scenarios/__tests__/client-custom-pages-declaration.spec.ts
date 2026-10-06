// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-pages declaration — the binding claim the
 * scenario makes (AC-10)
 *
 * ## Job To Be Done
 * A scenario declares WHAT it boots, HOW it draws, and WHICH module it tracks.
 * This spec asserts that claim against the declared surface: the scenario key
 * resolves through the shared registry, the bound composables are the two
 * real `client-custom-pages` composables, the single read keys on the route
 * SLUG rather than the default row id, and the tracked module owns a
 * committed feature.
 *
 * ## What Breaks If These Fail
 * A scenario key the registry cannot resolve is a page nobody can navigate
 * to. `useList`/`useDetail` naming the wrong (or no) composable is a page
 * that looks intact and silently does nothing. Most importantly: this
 * module's single read is keyed by `slug`, not the default `id`
 * (`useClientCustomPage().withId(slug)`) — a declaration that omits or
 * misspells `identifier` would have every detail-open resolve `undefined`
 * (or the wrong page), silently, because the row DOES carry an `id` field
 * the framework would otherwise happily (and wrongly) key on instead.
 *
 * ## What is NOT asserted here, and why
 * `schemas.query` publishing all three ADR-032 members (what makes
 * `useModulePort.ts`'s `ownsQueryState()` true and gives the page its
 * filter/sort surface) is a RUNTIME fact of the real composable's context,
 * not a static property of this declaration object — no sibling declaration
 * spec in this directory invokes a composable (they inspect only the static
 * declaration shape), and this file holds that same boundary rather than
 * introducing a live, unmocked network call into a lane that has none. That
 * capability is proven where it is actually exercised:
 * `client-custom-pages.collection.int.test.ts`'s "published schema family"
 * suite, against the real composable under MSW.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { get } from "lodash-es";
import { registry } from "../runtime/registry";
import declaration from "../useClientCustomPages/client-custom-pages.scenario";

// -----------------------------------------------------------------------------

const SCENARIO_DIRECTORY = "useClientCustomPages";

const MODULE_ROOT = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules",
  declaration.tracks ?? ""
);

// -----------------------------------------------------------------------------

describe("the declaration draws only what it declares", () => {
  it("names at least one of useList / useDetail", () => {
    expect(!!declaration.useList || !!declaration.useDetail).toBe(true);
  });

  it("declares useList and useDetail as the two real composables", () => {
    expect(declaration.useList).toBeDefined();
    expect(declaration.useDetail).toBeDefined();
    expect(typeof declaration.useList).toBe("function");
    expect(typeof declaration.useDetail).toBe("function");
  });

  it("declares no useMutate — the module is read-only (parity O24: reloadData is the oracle's only method)", () => {
    expect((declaration as Record<string, unknown>).useMutate).toBeUndefined();
  });

  it("declares no route — the registry attaches the directory", () => {
    expect((declaration as Record<string, unknown>).route).toBeUndefined();
    expect(get(registry, [declaration.key, "route"])).toBe(SCENARIO_DIRECTORY);
  });
});

describe("the single read keys on the route slug, not the default row id (AC-3/O7/O8)", () => {
  it("identifier is 'slug'", () => {
    expect(declaration.identifier).toBe("slug");
  });
});

describe("the declaration tracks a module with a committed feature", () => {
  it("names client-custom-pages under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("client-custom-pages");
    expect(existsSync(MODULE_ROOT)).toBe(true);
  });

  it("that module has a colocated .feature file", () => {
    const testDir = join(MODULE_ROOT, "__tests__");
    const feature = readdirSync(testDir).find(file =>
      file.endsWith(".feature")
    );
    expect(feature).toBeDefined();
  });

  it("the feature file tags at least one scenario", () => {
    const featurePath = join(
      MODULE_ROOT,
      "__tests__/client-custom-pages.feature"
    );
    const content = readFileSync(featurePath, "utf-8");
    expect(content).toContain("@AC-");
  });
});
