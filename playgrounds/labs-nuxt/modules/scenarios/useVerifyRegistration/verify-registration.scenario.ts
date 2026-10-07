// -----------------------------------------------------------------------------
/**
 * @module scenarios/useVerifyRegistration/verify-registration.scenario
 * @description The registration-activation link landing — a guest opens the
 * email link and is signed in, after a set-password step when the account has
 * no password.
 *
 * This module DRAWS ITSELF: `verify-registration.page.vue` beside this file is
 * the route's component. It declares no `useManage` and no `tracks`, so the
 * force corpus never arms and the page always reaches the real API — an
 * activation link is single-use, and only a live run can spend one.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const VERIFY_REGISTRATION_SCENARIO = "verify_registration";

export default {
  key: VERIFY_REGISTRATION_SCENARIO,
  presentation: {
    icon: "user-plus-01"
  }
} satisfies ScenarioDeclaration;
