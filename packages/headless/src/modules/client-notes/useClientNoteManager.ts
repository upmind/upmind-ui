import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
// Deep path, never the `../scope` barrel — see useClientNotes.ts for the
// aggregator-barrel `export *` hazard this sidesteps.
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import createClientNoteServices from "./client-notes.services";
import {
  ClientNoteContextTypes,
  CLIENT_NOTE_SCOPE_MATRIX
} from "./client-notes.types";
import { createClientNoteManagerActions } from "./useClientNoteManager.actions";
import { createClientNoteManagerContext } from "./useClientNoteManager.context";
import { createClientNoteManagerInternals } from "./useClientNoteManager.internals";
import { createClientNoteManagerMachineConfig } from "./useClientNoteManager.machine";
import { createClientNoteManagerMeta } from "./useClientNoteManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ClientNoteScopeMatrix } from "./client-notes.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopedComposable } from "../scope/scope.builder";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/useClientNoteManager
 * @description Scoped per-asset form editor, backed by the shared
 * `dataManagerMachine`. One interpreter per concrete `(actor, asset)` scope:
 * the record being edited comes from `.for('client-note', id)`, and a new one
 * is minted with `.fresh()`. Registered under the same module name as
 * `useClientNotes`; the scope key carries the differentiation.
 *
 * THE AMPUTATION GUARD (row M1): the 2026-08-05 client-email run shipped a
 * `variant=query` conversion against an oracle that shipped a manager, and
 * deleted this whole half with every gate green. This module ships BOTH
 * halves — the JTBD requires both.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape to
 * the collection half.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createClientNoteManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * The asset being edited is carried by the scope context; absent
   * (`.fresh()`) → a new draft. Reading the id from the scope rather than an
   * argument is what makes two concurrently-open editors two distinct
   * registry entries instead of one shared machine — the scope key IS the
   * isolation.
   */
  const noteId =
    config.context?.type === ClientNoteContextTypes.NOTE
      ? config.context.id
      : undefined;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the
   * manager issues, directly or through the machine, inherits the same
   * resolved client.
   */
  const service = createClientNoteServices(actorScope, config.context);

  const machineService = interpret(
    dataManagerMachine
      .withConfig(createClientNoteManagerMachineConfig(service))
      .withContext({
        id: noteId,
        // Identity, seeded from the ONE seam. Never read `activeUser` directly
        // in this file.
        clientId: service.clientId.value,
        // Scoped instances are persistent editors — stay editable after a save
        // (the machine returns to `available` instead of the `complete` final
        // state) so a remounting form re-uses the same instance.
        allowMultipleEdits: true
      }),
    {
      // The scope key, not the asset id: `.fresh()` mints a unique key per
      // call, so two concurrent drafts get two distinct interpreters instead
      // of colliding on a shared "new-asset" id.
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_notes_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session
   * may not have resolved yet. The id is watched off `service.clientId` — the
   * ONE identity seam, never a second session read — and `refreshContext`
   * keeps an already-present value, so this can never clobber a resolved
   * retarget. A session that never authenticates simply never fires it,
   * leaving the machine in `subscribing` with no unaddressed request.
   */
  const stopClientIdTopUp = watch(service.clientId, clientId => {
    if (!clientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input`
   * is debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers — two parses — and leaves `update`'s pre-save flush
   * with nothing to flush. The stateless layers below stay lazy.
   */
  const actions = createClientNoteManagerActions(
    actorScope,
    actorRef,
    service,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (form input, save, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (model, schema, errors). */
    useContext: () => createClientNoteManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientNoteManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientNoteManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing ONE client vault asset — note or secret,
 * one entity, `encrypted` decides which.
 *
 * @example
 * ```ts
 * // Edit an existing asset
 * const manager = useClientNoteManager().as('self').for('client-note', assetId)
 * const { model, schema, uischema } = manager.useContext()
 * await manager.useActions().isReady()
 * await manager.useActions().update({ note: 'updated' })
 *
 * // Create a new draft (isolated instance, distinct scope key)
 * const draft = useClientNoteManager().as('self').fresh()
 * ```
 */
export const useClientNoteManager = createScopedComposable<
  ReturnType<typeof createClientNoteManagerForScope>,
  ClientNoteScopeMatrix
>("client-notes", createClientNoteManagerForScope);

/**
 * @decision B3 — publish `scopeMatrix` on the EXPORTED composable, reading
 * the module's own `CLIENT_NOTE_SCOPE_MATRIX` constant, following the
 * `client-custom-fields` AC-37 precedent
 * (`useClientCustomFields.ts` — "publish `scopeMatrix` on the EXPORTED
 * wrapper").
 * what: this composable passes NO third runtime argument to
 *   `createScopedComposable` (the deliberate collection/manager asymmetry,
 *   design.md §7); `composable.scopeMatrix = scopeMatrix` inside
 *   `scope.builder.ts` therefore assigns `undefined` there. This line
 *   assigns the matrix VALUE afterwards, directly onto the exported
 *   `useClientNoteManager` reference — no second `createScopedComposable`
 *   call, so none of the import-cycle risk `useClientCustomFields`'s
 *   deferred-registration wrapper exists to avoid (this module's export is
 *   not deferred).
 * why: `useModulePort.ts` reads `composable.scopeMatrix` off the reference a
 *   page declaration names, BEFORE ever invoking it, and `servesActor`
 *   (`scope/scope-utils.ts`) treats an absent matrix as "no refusal" — so
 *   with no third argument and no follow-up assignment, the port opens for
 *   every actor, including the STAFF/GUEST cells this module's matrix pins
 *   `never` (B3).
 * rejected: passing `CLIENT_NOTE_SCOPE_MATRIX` as `createScopedComposable`'s
 *   third argument instead — preserves runtime correctness but erases the
 *   collection/manager asymmetry design.md §7 records as deliberate.
 */
(
  useClientNoteManager as ScopedComposable<
    ReturnType<typeof createClientNoteManagerForScope>,
    ClientNoteScopeMatrix
  >
).scopeMatrix = CLIENT_NOTE_SCOPE_MATRIX;

// Type export for consumers
export type UseClientNoteManager = ReturnType<typeof useClientNoteManager>;
