// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Implementation Pattern" +
 * "State Machine vs TanStack Query" + `code-composables.companion.md`
 * "Variance law" clauses 1/2/4, and ADR-001's four-layer return. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 *
 * THIS IS THE MANAGER HALF of the hybrid variant — the per-entity form editor
 * that sits beside `useModules.ts`'s collection. It is a SECOND scoped
 * composable in the same module, with its own scope matrix, its own registry
 * entry, and its own four layers.
 *
 * `@precedent` citations point at the recovered pre-FE-2824 `client-email`
 * tree (`useClientEmailManager.*`) and at the live-but-unscoped
 * `client-phone`/`client-address` managers. Cite them for facts; never copy
 * their shape — both are migration targets, and each carries at least one
 * defect this template deliberately does not reproduce (see the notes below).
 */

import { interpret } from "xstate";
import { createScopedComposable, ScopeActorTypes } from "../scope";
import { dataManagerMachine } from "../data-manager";
import { useActiveSession } from "../session-store";
import createModuleServices from "./module.services";
import { createModuleManagerMachineConfig } from "./useModuleManager.machine";
import { createModuleManagerActions } from "./useModuleManager.actions";
import { createModuleManagerContext } from "./useModuleManager.context";
import { createModuleManagerInternals } from "./useModuleManager.internals";
import { createModuleManagerMeta } from "./useModuleManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import { ModuleManagerContextTypes } from "./module.types";
import type { ModuleManagerScopeMatrix } from "./module.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleManager
 * @description Scoped per-entity manager — a form editor backed by the shared
 * `dataManagerMachine`. One interpreter per concrete `(actor, context)` scope:
 * the item being edited comes from `.for('module-item', id)`, a new item is
 * minted with `.fresh()`, and `.for('client', id)` retargets the whole editor
 * at another client. Returns ONLY the four sub-composable factories — no
 * direct props.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape to
 * the collection half, and to the machine variant.
 * @doctrine clause 4 (`.as('self')` builder-owned) — `config.actor` arriving
 * here is ALREADY a concrete actor; never branch on SELF in this file.
 * @precedent `client-email/useClientEmailManager.machine.ts` (the typed config
 * factory this file consumes).
 */
function createModuleManagerForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * The item being edited is carried by the scope context; absent (`.fresh()`,
   * or a `.for('client', id)` scope) → a new item. Reading the id from the
   * scope rather than an argument is what makes two concurrently-open editors
   * two distinct registry entries instead of one shared machine.
   */
  const itemId =
    config.context?.type === ModuleManagerContextTypes.ITEM
      ? config.context.id
      : undefined;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the manager
   * issues, directly or through the machine, inherits the same resolved target
   * client.
   */
  const service = createModuleServices(actorScope, config.context);

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createModuleManagerMachineConfig(service))
      .withContext({
        id: itemId,
        /**
         * Identity, seeded from the ONE seam: `.for('client', id)` lands here
         * as the resolved target; `.for('module-item', id)` and the bare self
         * case fall through to the session's active user, which always supplies
         * a client id. Never read `activeUser` directly in this file — that is
         * the FE-2824 shape.
         */
        clientId: service.clientId.value,
        /**
         * Scoped instances are persistent editors — stay editable after a save
         * (the machine returns to `available` instead of the `complete` final
         * state) so a remounting form re-uses the same instance. Set false only
         * if this module's parity table names a one-shot form.
         */
        allowMultipleEdits: true
      }),
    {
      // The scope key, not the item id: `.fresh()` mints a unique key per call
      // (`scope.utils.ts` `generateScopeKey`), so two concurrent drafts get two
      // distinct interpreters instead of colliding on a shared "new-item" id.
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      "Module manager not available",
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session may
   * not have resolved yet — so a self-scoped manager can legitimately start
   * without one. `refreshContext` keeps an already-present value
   * (`clientId || data?.clientId`), so this can never clobber a
   * `.for('client', id)` retarget with the session's own id.
   *
   * The id still comes from `service.clientId` — the same seam — not from a
   * second `useActiveSession().useContext()` read.
   */
  const { isReady: ensureAuth } = useActiveSession().useActions();
  ensureAuth()
    .then(ok => {
      const clientId = ok ? service.clientId.value : undefined;
      if (clientId && !contextMatches(actorRef.state, "clientId")) {
        actorRef.send({ type: "REFRESH", data: { clientId } });
      }
    })
    .catch(() => {
      /* guest sessions won't be authenticated — the machine stays subscribing */
    });

  return {
    // --- Sub-composables (no direct props — clause 1 / Part B Four-Layer Return Shape)
    /** Sub-composable for manager actions (form input, save, lifecycle). */
    useActions: () =>
      createModuleManagerActions(actorScope, actorRef, service, scopeKey),

    /** Sub-composable for manager context (model, schema, errors). */
    useContext: () => createModuleManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createModuleManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createModuleManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped per-entity manager — replace this JSDoc with the module's real usage.
 *
 * @example
 * ```ts
 * // Edit one existing item
 * const manager = useModuleManager().as('client').for('module-item', itemId)
 * await manager.useActions().isReady()
 * await manager.useActions().update({ name: 'new name' })
 *
 * // Create a new item (isolated instance, distinct scope key)
 * const draft = useModuleManager().as('client').fresh()
 *
 * // Staff acting for another client
 * const forClient = useModuleManager().as('staff').for('client', clientId).fresh()
 * ```
 */
export const useModuleManager = createScopedComposable<
  ReturnType<typeof createModuleManagerForScope>,
  ModuleManagerScopeMatrix
>("module", createModuleManagerForScope);

// Type export for consumers
export type UseModuleManager = ReturnType<typeof useModuleManager>;
