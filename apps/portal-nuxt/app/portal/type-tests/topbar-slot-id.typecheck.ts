// -----------------------------------------------------------------------------
/**
 * @module portal/type-tests/topbar-slot-id
 * @description Compile-only proof for AC1.2 (bdd.md B1 — "an unknown slot id
 * cannot be written"): a slot id absent from a primitive's declared slot set
 * is a build-time error, not a silently ignored key. Checked by
 * `pnpm --filter @upmind-automation/portal-nuxt type-check`; vitest never
 * runs this file. Paired blind with tests/topbar-slot-id.must-fail.patch —
 * widening `TopbarSlotId` makes the `@ts-expect-error` below unused, which is
 * itself a type-check error, so the control still goes red.
 */

import { PRIMITIVE_ID } from "../types";
import type { TopbarConfig } from "../types";

export const topbarRejectsAnUndeclaredSlotId: TopbarConfig = {
  primitive: PRIMITIVE_ID.TOPBAR,
  slots: {
    // @ts-expect-error — "bottom" is not one of the topbar's declared slot ids (left | centre | right).
    bottom: { kind: "module", id: "fixture-marker" }
  }
};
