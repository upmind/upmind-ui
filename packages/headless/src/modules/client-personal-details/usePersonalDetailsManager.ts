import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope";
import { useI18n } from "../system-localisation";
import createClientPersonalDetailsServices from "./client-personal-details.services";
import { createPersonalDetailsManagerActions } from "./usePersonalDetailsManager.actions";
import { createPersonalDetailsManagerContext } from "./usePersonalDetailsManager.context";
import { createPersonalDetailsManagerInternals } from "./usePersonalDetailsManager.internals";
import { createPersonalDetailsManagerMachineConfig } from "./usePersonalDetailsManager.machine";
import { createPersonalDetailsManagerMeta } from "./usePersonalDetailsManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { PersonalDetailsScopeMatrix } from "./client-personal-details.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetailsManager
 * @description Scoped `dataManagerMachine`-backed editor for a client's own
 * profile. One interpreter per concrete `(actor, context)` scope.
 *
 * @decision registered under its OWN registry name, not the read half's.
 * what:    this composable's `createScopedComposable` call names
 *          `"client-personal-details-manager"`, not
 *          `"client-personal-details"` — a deliberate departure from
 *          `useClientEmailManager`'s literal precedent (same name as
 *          `useClientEmails`).
 * why:     `generateScopeKey(name, config)` is `name:actor[:context.type:
 *          context.id][:brand][:fresh]` (`scope.utils.ts`) — NOTHING else
 *          differentiates two composables sharing one name. `client-email`
 *          gets away with sharing a name only because its manager is NEVER
 *          called bare: every call site supplies either `.withId(id)`
 *          (an existing address) or `.fresh()` (a new draft), both of which
 *          add a segment the collection's own `.as('client')` (no `.for()`)
 *          never has. This module's shared single-member `PROFILE` context
 *          has no such guarantee — `.as('client')` with NO `.for()` is the
 *          NORMAL call for BOTH halves (a client has exactly one profile, so
 *          there is nothing to pick), which would make the read half's and
 *          the manager's scope keys IDENTICAL under a shared name — the
 *          registry would hand one consumer the other's instance. A modules
 *          two DISTINCT registry names is the fix; the SHARED scope MATRIX
 *          (design.md §3.2) still holds — both use the same
 *          `ClientPersonalDetailsContextTypes.PROFILE` context and the same
 *          identity seam, only the registry key's `name:` segment differs.
 * rejected: keeping one shared name and requiring every manager call site to
 *          add `.for('profile', clientId)` — rejected: it forces every
 *          caller to know and re-supply the client's own id just to avoid a
 *          collision, for an entity that already has exactly one profile;
 *          brittle and easy to forget.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape
 * to the read half.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createPersonalDetailsManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the
   * manager issues, directly or through the machine, inherits the same
   * resolved client.
   */
  const service = createClientPersonalDetailsServices(
    actorScope,
    config.context
  );

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createPersonalDetailsManagerMachineConfig(service))
      .withContext({
        // The PROFILE entity's id IS the owning client's id (design.md
        // §3.4) — both fields seed from the ONE resolved seam.
        id: service.clientId.value,
        clientId: service.clientId.value,
        lookups: { fields: [], filterFields: [], languages: [] },
        // Scoped instances are persistent editors — stay editable after a
        // save (the machine returns to `available` instead of the
        // `complete` final state) so a remounting form re-uses the same
        // instance.
        allowMultipleEdits: true
      }),
    {
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_personal_details_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session
   * may not have resolved yet. The id is watched off `service.clientId` —
   * the ONE identity seam, never a second session read — and
   * `refreshContext` keeps an already-present value, so this can never
   * clobber a resolved retarget. A session that never authenticates simply
   * never fires it, leaving the machine in `subscribing` with no
   * unaddressed request (AC-42).
   */
  const stopClientIdTopUp = watch(service.clientId, clientId => {
    if (!clientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId, id: clientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input`
   * is debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers.
   */
  const actions = createPersonalDetailsManagerActions(
    actorScope,
    actorRef,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (form input, save, revert, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (model, schema, errors). */
    useContext: () => createPersonalDetailsManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createPersonalDetailsManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createPersonalDetailsManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing a client's own profile. Callable bare
 * (AC-43) — `usePersonalDetailsManager().as('client')` constructs and
 * settles without a caller-supplied option.
 *
 * @example
 * ```ts
 * const manager = usePersonalDetailsManager().as('self')
 * const { model, schema, uischema } = manager.useContext()
 * manager.useActions().filterFields(['firstName'])
 * await manager.useActions().isReady()
 * await manager.useActions().update({ firstName: 'New' })
 * ```
 */
export const usePersonalDetailsManager = createScopedComposable<
  ReturnType<typeof createPersonalDetailsManagerForScope>,
  PersonalDetailsScopeMatrix
>("client-personal-details-manager", createPersonalDetailsManagerForScope);

// Type export for consumers
export type UsePersonalDetailsManager = ReturnType<
  typeof usePersonalDetailsManager
>;
