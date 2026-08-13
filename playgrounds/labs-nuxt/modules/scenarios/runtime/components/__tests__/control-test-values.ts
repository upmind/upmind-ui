/**
 * @module scenarios/runtime/components/__tests__/control-test-values
 * @description The `data-test-value` each list control actually carries, keyed
 * by the action it fires.
 *
 * These are NOT the action ids. `Button.ce.vue` derives its test value from the
 * rendered LABEL when no explicit `dataAttrs` is supplied, so the i18n sweep
 * moved `add` -> `add-new`, `setDefault` -> `set-as-default` and the overflow
 * trigger -> `show-more-options`, while `edit` / `remove` / `verify`
 * coincidentally kept their names. The mapping lives here, once, so the coupling
 * is visible instead of scattered across selectors — and so the day the surfaces
 * supply explicit `dataAttrs` (the repo's stated contract,
 * `code-tests.companion.md`), one edit re-points every spec.
 */

import clientEmails from "../../../useClientEmails/client-email.scenario";
import { fromPairs, map } from "lodash-es";

/**
 * Keyed off the client-emails page's OWN declaration rather than a renderer-side action
 * vocabulary: with the actions declared per scenario, `LIST_SURFACE_ACTION` no
 * longer exists and the declared names are the only source there is.
 */
const DECLARED_TEST_VALUE: Record<string, string> = {
  edit: "edit",
  remove: "remove",
  setDefault: "set-as-default",
  verify: "verify",
  add: "add-new"
};

export const CONTROL_TEST_VALUE: Record<string, string> = fromPairs(
  map(clientEmails.presentation.actions.elements, action => [
    action.name,
    DECLARED_TEST_VALUE[action.name] as string
  ])
);

/** The overflow trigger `ActionSlots` renders, same derivation. */
export const OVERFLOW_TRIGGER_TEST_VALUE = "show-more-options";
