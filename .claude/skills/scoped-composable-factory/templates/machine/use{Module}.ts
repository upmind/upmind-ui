// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Implementation Pattern" +
 * `code-composables.companion.md` "Variance law" clauses 1/2/4. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 */

import { interpret } from "xstate";
import { createScopedComposable } from "../scope";
import machine from "./module.machine";
import { createModuleActions } from "./useModule.actions";
import { createModuleContext } from "./useModule.context";
import { createModuleInternals } from "./useModule.internals";
import { createModuleMeta } from "./useModule.meta";
import {
  createActor,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ModuleContext, ModuleScopeMatrix } from "./module.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ScopeConfig, ScopeKey } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule
 * @description Scoped module composable. Replace this line with the module's
 * job to be done (factory intake answer #1).
 *
 * @doctrine clause 1 (uniform four-layer default) — returns exactly the four
 * sub-composables below, regardless of actor.
 * @doctrine clause 4 (`.as('self')` builder-owned) — `config.actor` arriving
 * here is ALREADY a concrete actor; this factory never imports or branches on
 * `ScopeActorTypes.SELF` (the only resolution site is `scope/scope.builder.ts`
 * via `scope/scope.utils.ts`'s `resolveSelfActor`).
 * @worked-example `account/useAccount.ts`.
 */

/**
 * @doctrine clause 2 (fresh modules start armless) — this factory does not
 * branch on `actorScope` itself; actor-aware behaviour (if any is ever
 * earned) lives inside the sub-composable factories below, per clause 3.
 * @private
 */
// Two args — `scope.builder.ts`'s `finalize` calls `factory(resolvedConfig, key)`;
// a third parameter would misbind `scopeKey` to `undefined`.
function createModuleForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = interpret(
    machine.withContext({
      scopeActor: actorScope,
      scopeContext: config.context,
      brandId: config.brandId,
      error: undefined
    } as ModuleContext),
    { devTools: true }
  );
  service.start();

  const actorRef = createActor(service);
  if (!actorRef) {
    throw new DetailedError(
      "Module unavailable",
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  return {
    // --- Sub-composables (no direct props — clause 1 / Part B Four-Layer Return Shape)
    /** Sub-composable for module actions (machine events). */
    useActions: () => createModuleActions(actorScope, actorRef, scopeKey),

    /** Sub-composable for module context (computed values). */
    useContext: () => createModuleContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleInternals(actorScope, actorRef),

    /** Sub-composable for module meta (state flags). */
    useMeta: () => createModuleMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable — replace this JSDoc with the module's real usage example.
 *
 * @example
 * ```ts
 * const module = useModule().as('self')
 * ```
 */
export const useModule = createScopedComposable<
  ReturnType<typeof createModuleForScope>,
  ModuleScopeMatrix
>("module", createModuleForScope);

// Type export for consumers
export type UseModule = ReturnType<typeof useModule>;
