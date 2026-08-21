// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Four-Layer Return Shape"
 * (Context row) + "Canonical State-Read APIs". A disagreement between this
 * skeleton, its worked example, and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 */

import { useContext } from "../../utils";
import type { ModuleModel } from "./module.types";
import type { ResponseError, UseActor } from "../../utils";
import { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context
 * @description Module context factory (computed data from state).
 *
 * NOTE: never access `state.value.context` directly — always `useContext`.
 *
 * @doctrine clause 2 — shared-only (armless); a per-actor
 * `useModule.context.{actor}.ts` exists only when a scope's context members
 * are exclusive to it or override this shared factory (clause 3).
 * @worked-example `account/useAccount.context.ts`.
 */
export function createModuleContext(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const errors = useContext<ResponseError["message"]>(state, "error.message");

  /**
   * Base reference data every actor needs. Canonical A vs A+B override
   * candidate: shared returns A (the base set); an arm may spread its own
   * `lookups` LAST to return A + B (base set + actor-specific additions).
   * See `useModule.context.{actor}.ts` for the arm-side override shape.
   */
  const lookups = useContext<Record<string, unknown>[]>(state, "lookups", []);

  const model = useContext<ModuleModel>(state, "model");

  // --- actor-specific context: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, import its factory and spread it LAST so
  // it wins, exactly as `auth/useAuth.actions.ts:196-201` does:
  //   const actorContext =
  //     actorScope === ScopeActorTypes.CLIENT
  //       ? createClientModuleContext(actor)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** Validation/response error messages from machine context. */
    errors,

    /** Base reference data every actor needs (see JSDoc — override candidate). */
    lookups,

    /** The active form model held in machine context. */
    model

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorContext
  };
}

// Type export for consumers
export type UseModuleContext = ReturnType<typeof createModuleContext>;
