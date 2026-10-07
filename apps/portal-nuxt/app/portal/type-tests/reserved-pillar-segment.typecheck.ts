// -----------------------------------------------------------------------------
/**
 * @module portal/type-tests/reserved-pillar-segment
 * @description Compile-only proof for AC1.6 (design.md §D9 consequence 2): a
 * product group cannot claim a reserved pillar's segment. Checked by
 * `pnpm --filter @upmind-automation/portal-nuxt type-check`; vitest never
 * runs this file. Paired blind with
 * tests/reserved-pillar-segment.must-fail.patch — widening
 * `NotReservedSegment` makes the `@ts-expect-error` below unused, which is
 * itself a type-check error, so the control still goes red.
 */

import { defineCustomArea, defineProductGroup } from "../routes";
import type { CustomArea, PortalConfig, ProductGroup } from "../types";
// -----------------------------------------------------------------------------

export const productGroupCannotClaimTheBillingPillar = defineProductGroup({
  // @ts-expect-error — "billing" is a reserved pillar segment; a product group cannot claim it as its slug.
  slug: "billing",
  label: "Should never compile"
});

export const customAreaCannotClaimTheSupportPillarEither = defineCustomArea({
  // @ts-expect-error — same guard, same reserved set, applied to a Custom Area's slug.
  slug: "support",
  label: "Should never compile"
});

/**
 * The array/variable-context authoring position (commit 61177e956e; prover
 * addition for tests/product-group-context-slug.must-fail.patch). A call
 * sitting inside its own contextual type — a `PortalConfig["groups"]`-typed
 * array, a `ProductGroup`-typed variable — lets TypeScript infer `Slug`
 * from that context (defaulting to `string`) instead of the passed literal,
 * which would let a reserved slug slip through here even though the bare,
 * unannotated call above still errors. `defineProductGroup`/
 * `defineCustomArea`'s `NoInfer<Slug>` return type closes exactly this gap;
 * undoing it (the must-fail patch) makes each `@ts-expect-error` below
 * unused, which is itself a type-check error, so the control goes red.
 */
export const groupsArrayContextCannotClaimTheBillingPillar: PortalConfig["groups"] =
  [
    defineProductGroup({
      // @ts-expect-error — "billing" is reserved even written inline in a PortalConfig-typed groups array.
      slug: "billing",
      label: "Should never compile"
    })
  ];

export const productGroupVariableContextCannotClaimTheBillingPillar: ProductGroup =
  defineProductGroup({
    // @ts-expect-error — same guard, applied to a directly ProductGroup-typed variable, not just a bare call.
    slug: "billing",
    label: "Should never compile"
  });

export const customAreasArrayContextCannotClaimTheSupportPillar: PortalConfig["customAreas"] =
  [
    defineCustomArea({
      // @ts-expect-error — same guard, same array-context shape, for a Custom Area.
      slug: "support",
      label: "Should never compile"
    })
  ];

export const customAreaVariableContextCannotClaimTheSupportPillar: CustomArea =
  defineCustomArea({
    // @ts-expect-error — same guard, applied to a directly CustomArea-typed variable, not just a bare call.
    slug: "support",
    label: "Should never compile"
  });
