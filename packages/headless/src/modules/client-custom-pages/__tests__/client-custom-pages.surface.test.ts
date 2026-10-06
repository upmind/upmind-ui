// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-pages — the public barrel's shape (D1, parity O1)
 *
 * ## Job To Be Done
 * Assert every named export the barrel (`index.ts`) carries: both composables
 * are callable, the COLLECTION's scope matrix resolves `[CLIENT]` and nothing
 * else (D1, operator ruling 2026-09-09), the sortable-properties enum carries
 * the documented default and value, and the sub-composable type-only exports
 * exist (compile-time, via `expectTypeOf`). This is the general shape proof
 * that catches an FE-2824-shaped drop — a `client` cell silently stopping
 * resolving, or an actor cell being added that the design never sanctioned —
 * without asserting the cell RETARGETS anything (design.md D1's `consequence:`
 * — it does not, and no test here claims it does).
 *
 * ## What Breaks If These Fail
 * The collection's actor surface silently drifts from the landed portal
 * contract it is required to mirror (D1), or a `.for()` capability that
 * design.md explicitly rejected (a resolving GUEST/BRAND cell) is silently
 * re-opened.
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import * as barrel from "..";
import {
  CLIENT_CUSTOM_PAGES_SCOPE_MATRIX,
  ClientCustomPagesContextTypes,
  CustomPagesSortableProperties,
  useClientCustomPage,
  useClientCustomPages
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import type {
  CustomPage,
  CustomPagesFilterModel,
  CustomPagesFilters,
  CustomPagesSortEntry,
  CustomPagesSortModel,
  UseClientCustomPage,
  UseClientCustomPageActions,
  UseClientCustomPageContext,
  UseClientCustomPageInternals,
  UseClientCustomPageMeta,
  UseClientCustomPages,
  UseClientCustomPagesActions,
  UseClientCustomPagesContext,
  UseClientCustomPagesInternals,
  UseClientCustomPagesMeta
} from "..";

// -----------------------------------------------------------------------------

describe("client-custom-pages barrel — every consumer-facing name", () => {
  it("exports both composables as callable functions", () => {
    expect(typeof useClientCustomPages).toBe("function");
    expect(typeof useClientCustomPage).toBe("function");
  });

  it("resolves the collection's [CLIENT] cell and nothing else (D1)", () => {
    expect(CLIENT_CUSTOM_PAGES_SCOPE_MATRIX.client).toBe(
      ClientCustomPagesContextTypes.CLIENT
    );
    expect(CLIENT_CUSTOM_PAGES_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeFalsy();
    expect(CLIENT_CUSTOM_PAGES_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeFalsy();
    expect(CLIENT_CUSTOM_PAGES_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeFalsy();
  });

  it("exports the sortable-properties enum with the documented default and value", () => {
    expect(CustomPagesSortableProperties.DEFAULT).toBe("created_at");
    expect(CustomPagesSortableProperties.NAME).toBe("name");
  });

  it("carries the model and sub-composable type exports at compile time", () => {
    expectTypeOf<CustomPage>().toHaveProperty("slug");
    expectTypeOf<CustomPagesFilters>().toHaveProperty("showOnMenu");
    expectTypeOf<CustomPagesFilterModel>().not.toBeAny();
    expectTypeOf<CustomPagesSortEntry>().not.toBeAny();
    expectTypeOf<CustomPagesSortModel>().not.toBeAny();
    expectTypeOf<UseClientCustomPages>().not.toBeAny();
    expectTypeOf<UseClientCustomPage>().not.toBeAny();
    expectTypeOf<UseClientCustomPagesActions>().not.toBeAny();
    expectTypeOf<UseClientCustomPagesContext>().not.toBeAny();
    expectTypeOf<UseClientCustomPagesMeta>().not.toBeAny();
    expectTypeOf<UseClientCustomPagesInternals>().not.toBeAny();
    expectTypeOf<UseClientCustomPageActions>().not.toBeAny();
    expectTypeOf<UseClientCustomPageContext>().not.toBeAny();
    expectTypeOf<UseClientCustomPageMeta>().not.toBeAny();
    expectTypeOf<UseClientCustomPageInternals>().not.toBeAny();
  });
});

describe("client-custom-pages barrel — the item door mints no context of its own (design.md D1)", () => {
  it("offers no per-item context enum and no per-item scope matrix export", () => {
    // The single read's scope matrix is deliberately internal (design.md §5,
    // "not barrel-exported"): a record key (`.withId(slug)`) is not an
    // ADR-001 context. A future re-mint of one under a name this barrel
    // carries would be re-opening a settled question silently.
    expect(barrel).not.toHaveProperty("ClientCustomPageContextTypes");
    expect(barrel).not.toHaveProperty("CLIENT_CUSTOM_PAGE_SCOPE_MATRIX");
  });

  it("advertises no scope matrix on the single-read composable itself", () => {
    expect(useClientCustomPage.scopeMatrix).toBeUndefined();
  });

  it("names the record with .withId, at every builder position", () => {
    expect(typeof useClientCustomPage().withId).toBe("function");
    expect(typeof useClientCustomPage().as(ScopeActorTypes.CLIENT).withId).toBe(
      "function"
    );
  });
});
