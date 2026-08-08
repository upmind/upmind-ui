/**
 * @module factory/__tests__/control-test-values
 * @description The `data-test-value` each list control actually carries, keyed
 * by the action it fires.
 *
 * These are NOT the action ids. `Button.ce.vue` derives its test value from the
 * rendered LABEL when no explicit `dataAttrs` is supplied, so the i18n sweep
 * moved `ensure` -> `add-new`, `setDefault` -> `set-as-default` and the overflow
 * trigger -> `show-more-options`, while `remove` / `verify` coincidentally kept
 * their names. The mapping lives here, once, so the coupling is visible instead
 * of scattered across selectors — and so the day the surfaces supply explicit
 * `dataAttrs` (the repo's stated contract, `code-tests.companion.md`), one edit
 * re-points every spec.
 */

import { LIST_SURFACE_ACTION } from "../surfaces";

export const CONTROL_TEST_VALUE: Record<string, string> = {
  [LIST_SURFACE_ACTION.DELETE]: "remove",
  [LIST_SURFACE_ACTION.SET_DEFAULT]: "set-as-default",
  [LIST_SURFACE_ACTION.RESEND]: "verify",
  [LIST_SURFACE_ACTION.ADD]: "add-new"
};

/** The overflow trigger `ActionSlots` renders, same derivation. */
export const OVERFLOW_TRIGGER_TEST_VALUE = "show-more-options";
