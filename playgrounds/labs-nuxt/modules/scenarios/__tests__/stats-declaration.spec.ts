// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/stats-declaration.spec
 * @description The stats declaration binds no collection and no editor — the
 * directory DRAWS ITSELF (design DA21, ruling R11 B1): its own
 * `stats.page.vue` is the route component, so the shared list/detail renderer
 * never sees this scenario and the shared-renderer shape (a table, a card, a
 * form) has no member to declare here. ONE declaration now covers both of the
 * module's concerns, because the module behind them is ONE composable.
 * Negative control: `stats-declaration.must-fail.patch`.
 */
import { describe, expect, it } from "vitest";
import declaration from "../useStats/stats.scenario";

// -----------------------------------------------------------------------------

/** The token the scenario template ships; a declaration must replace it. */
const PLACEHOLDER_ICON = "icon-name";

// -----------------------------------------------------------------------------

describe("the declaration names itself and draws no shared collection", () => {
  it("declares its own key", () => {
    expect(declaration.key).toBe("stats");
  });

  it("binds no collection and no editor — the page draws itself (DA21)", () => {
    expect(declaration.useList).toBeUndefined();
    expect(declaration.useMutate).toBeUndefined();
  });

  it("declares no route — the directory IS the route", () => {
    expect("route" in declaration).toBe(false);
  });
});

describe("the declaration's presentation names a real module icon", () => {
  it("names a real icon, never the template placeholder", () => {
    expect(declaration.presentation.icon).toBeTruthy();
    expect(declaration.presentation.icon).not.toBe(PLACEHOLDER_ICON);
  });

  it("declares no table, card, detail or actions — nothing here for the shared renderer to draw", () => {
    expect(declaration.presentation.table).toBeUndefined();
    expect(declaration.presentation.card).toBeUndefined();
    expect(declaration.presentation.detail).toBeUndefined();
    expect(declaration.presentation.actions).toBeUndefined();
  });
});
