// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/client-billing-settings-declaration.spec
 * @description The billing-settings declaration draws only what it declares
 * — a FORM_FLOW page over the manager alone (a client has ONE consolidation
 * preference, so there is no collection and no `useList`), tracking a module
 * with a committed, tagged feature, and naming a real icon rather than the
 * template's placeholder. Negative control:
 * `client-billing-settings-declaration.ref-coercion.must-fail.patch`.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import declaration from "../useBillingSettingsManager/client-billing-settings.scenario";
// -----------------------------------------------------------------------------

const MODULE_ROOT = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules",
  declaration.tracks ?? ""
);

/** The token the scenario template ships; a declaration must replace it. */
const PLACEHOLDER_ICON = "icon-name";

// -----------------------------------------------------------------------------

describe("the declaration binds composables", () => {
  it("names the manager and no collection — one preference per client", () => {
    expect(declaration.useMutate).toBeDefined();
    expect(declaration.useList).toBeUndefined();
  });

  it("declares no route — the directory IS the route", () => {
    expect("route" in declaration).toBe(false);
  });
});

describe("the declaration's presentation is FORM_FLOW-shaped", () => {
  it("declares no table, card, detail or actions — the live port draws the form", () => {
    expect(declaration.presentation.table).toBeUndefined();
    expect(declaration.presentation.card).toBeUndefined();
    expect(declaration.presentation.detail).toBeUndefined();
    expect(declaration.presentation.actions).toBeUndefined();
  });

  it("names a real icon, never the template placeholder", () => {
    expect(declaration.presentation.icon).toBeTruthy();
    expect(declaration.presentation.icon).not.toBe(PLACEHOLDER_ICON);
  });
});

describe("the declaration tracks a module with a committed feature", () => {
  it("names a module under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("client-billing-settings");
    expect(existsSync(MODULE_ROOT)).toBe(true);
  });

  it("that module has a colocated .feature file", () => {
    const feature = readdirSync(join(MODULE_ROOT, "__tests__")).find(file =>
      file.endsWith(".feature")
    );
    expect(feature).toBeDefined();
  });

  it("the feature file tags at least one scenario", () => {
    const content = readFileSync(
      join(MODULE_ROOT, "__tests__/client-billing-settings.feature"),
      "utf-8"
    );
    expect(content).toContain("@AC-");
  });
});
