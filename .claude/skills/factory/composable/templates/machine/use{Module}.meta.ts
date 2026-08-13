// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part A "Meta Properties Pattern"
 * + Part B "Four-Layer Return Shape" (Meta row). A disagreement between this
 * skeleton, its worked example, and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 */

import { useStateMatches } from "../../utils";
import type { UseActor } from "../../utils";
import { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta
 * @description Module meta factory — computed state flags, `is`/`has`/`can`/
 * `show` prefixed, one computed per flag (never a single `meta` object in new
 * code).
 * @doctrine clause 2 — shared-only (armless).
 * @worked-example `account/useAccount.meta.ts`.
 */

export function createModuleMeta(actorScope: ScopeActorTypes, actor: UseActor) {
  const { state } = actor;

  const isProcessing = useStateMatches(state, [
    "available.checking",
    "available.loggingIn",
    "available.registering"
  ]);
  const hasErrors = useStateMatches(state, "error");
  const hasValidationErrors = useStateMatches(state, "available.invalid");
  const isComplete = useStateMatches(state, ["complete", "done"]);

  // --- actor-specific meta: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, import its factory and spread it LAST so
  // it wins, exactly as `auth/useAuth.actions.ts:196-201` does:
  //   const actorMeta =
  //     actorScope === ScopeActorTypes.CLIENT
  //       ? createClientModuleMeta(actor)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** True if the active form has BE errors. */
    hasErrors,

    /** True if the active form has validation errors. */
    hasValidationErrors,

    /** True once the flow reached its terminal state. */
    isComplete,

    /** True while the module is processing (validating/submitting). */
    isProcessing

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseModuleMeta = ReturnType<typeof createModuleMeta>;
