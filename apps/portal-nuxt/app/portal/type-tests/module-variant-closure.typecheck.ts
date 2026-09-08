// -----------------------------------------------------------------------------
/**
 * @module portal/type-tests/module-variant-closure
 * @description Compile-only proof for AC2.4: a module's variant set is
 * closed — a variant the module does not declare is a build-time error.
 * Checked by `pnpm --filter @upmind-automation/portal-nuxt type-check`;
 * vitest never runs this file. No must-fail patch pairs with this one — the
 * guard is `moduleRef`'s own generic signature (registry.ts), not a
 * conditional a single line-mutation can disable — so it is proved directly
 * against the fixture module rather than verified blind against a mutant.
 */

import { FIXTURE_MODULE_ID, moduleRef } from "../registry";
import type { ModuleRef } from "../types";

export const fixtureModuleAcceptsItsOwnDeclaredVariant = moduleRef(
  FIXTURE_MODULE_ID,
  { variant: "alternate" }
);

export const fixtureModuleVariantSetIsClosed = moduleRef(FIXTURE_MODULE_ID, {
  // @ts-expect-error — "form" is not one of the fixture module's declared variants (default | alternate).
  variant: "form"
});

/**
 * AC2.4's second authoring position (prover addition for
 * tests/module-ref-variant-literal.must-fail.patch): `moduleRef()`'s own
 * generic signature is only one way to author a `ModuleRef`. A plain
 * object literal naming a `variant` must be rejected too — it cannot carry
 * `MODULE_REF_TAG`, the tag only `moduleRef()` attaches once it has
 * actually checked the variant against the module's declared set
 * (types.ts, registry.ts). Undoing `ModuleRef`'s two-member discriminated
 * union back into one shape with an optional, ungated `variant` (the must-
 * fail patch) makes this literal type-check clean, so the `@ts-expect-error`
 * below goes unused — itself a type-check error — and the control goes red.
 */
// @ts-expect-error — a bare object literal can't carry MODULE_REF_TAG, so it can't declare a variant at all, checked or not.
export const fixtureModuleVariantSetIsClosedAsAPlainLiteral: ModuleRef = {
  kind: "module",
  id: FIXTURE_MODULE_ID,
  variant: "form"
};
